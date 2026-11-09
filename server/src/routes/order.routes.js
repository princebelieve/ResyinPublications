const express = require("express");
const crypto = require("crypto");
const Order = require("../models/Order");
const { verifyOrderPayment } = require("../services/orderPayment");
const paystack = require("../services/paystack");
const { protect } = require("../middleware/auth");

const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");

const router = express.Router();

// High-entropy confirmation links remain reusable until expiry so refresh and
// payment polling work. Payment references never grant access to order data.
router.get("/confirmation/:token", async (req, res) => {
  try {
    const confirmationTokenHash = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    let order = await Order.findOne(
      {
        confirmationTokenHash,
        confirmationTokenExpires: { $gt: new Date() },
      },
    );

    if (!order) {
      return res.status(404).json({
        message: "This order confirmation link is invalid or expired.",
      });
    }

    try {
      ({ order } = await verifyOrderPayment(order));
    } catch (error) {
      // Keep the saved order visible if Paystack is temporarily unavailable.
      console.warn("Confirmation verification pending:", error.message);
    }
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load order confirmation" });
  }
});

router.post("/:id/verify-payment", protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found." });
    const result = await verifyOrderPayment(order);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(503).json({ message: "Unable to check payment right now. Your order is saved. Please try again; do not pay again if you were debited." });
  }
});

// Recreates a secure Paystack checkout for a customer's own unpaid order.
router.post("/:id/complete-payment", protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.paymentStatus === "paid") return res.status(400).json({ message: "This order is already paid." });
    if (order.paymentMethod !== "paystack") return res.status(400).json({ message: "This order does not use online payment." });

    const verified = await verifyOrderPayment(order);
    if (verified.order.paymentStatus === "paid") return res.json({ paid: true, order: verified.order });
    if (!verified.canRetry) return res.status(409).json({ message: "Your payment may still be processing. Check payment status again; do not pay again if you were debited." });

    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const confirmationTokenHash = crypto.createHash("sha256").update(confirmationToken).digest("hex");
    const payment = await paystack.post("/transaction/initialize", {
      email: order.email,
      amount: Number(order.totalAmount || 0) * 100,
      currency: order.currency || "NGN",
      callback_url: `${clientUrl}/success?order_token=${confirmationToken}`,
      metadata: { userId: order.userId, orderId: String(order._id), resumedPayment: true },
    });
    order.paymentReference = payment.data.data.reference;
    order.paymentReferences = [...new Set([...(order.paymentReferences || []), payment.data.data.reference])];
    order.confirmationTokenHash = confirmationTokenHash;
    order.confirmationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await order.save();
    res.json({ authorization_url: payment.data.data.authorization_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to restart payment. Please try again." });
  }
});

module.exports = router;
