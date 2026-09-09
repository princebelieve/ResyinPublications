const express = require("express");
const crypto = require("crypto");
const Order = require("../models/Order");
const paystack = require("../services/paystack");
const { protect } = require("../middleware/auth");

const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");

const router = express.Router();

// The checkout creates a high-entropy token that is valid for 24 hours and
// consumed atomically on first use. Payment references must never grant access
// to order/contact data.
router.get("/confirmation/:token", async (req, res) => {
  try {
    const confirmationTokenHash = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const order = await Order.findOneAndUpdate(
      {
        confirmationTokenHash,
        confirmationTokenExpires: { $gt: new Date() },
      },
      { $unset: { confirmationTokenHash: 1, confirmationTokenExpires: 1 } },
      { new: false },
    );

    if (!order) {
      return res.status(404).json({
        message: "This order confirmation link is invalid, expired, or has already been used.",
      });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load order confirmation" });
  }
});

// Recreates a secure Paystack checkout for a customer's own unpaid order.
router.post("/:id/complete-payment", protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found." });
    if (order.paymentStatus === "paid") return res.status(400).json({ message: "This order is already paid." });
    if (order.paymentMethod !== "paystack") return res.status(400).json({ message: "This order does not use online payment." });

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
