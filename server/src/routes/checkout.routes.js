//server/src/routes/checkout.routes.js
const express = require("express");
const crypto = require("crypto");
const router = express.Router();

const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const StorePaymentSettings = require("../models/StorePaymentSettings");
const paystack = require("../services/paystack");
const { protect } = require("../middleware/auth");
const { calculateShipping } = require("../config/shipping");
const {
  createNotification,
  countUnreadNotifications,
} = require("../services/notification.service");
const { sendPushToUser } = require("../services/push.service");

const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")[0]
  .trim()
  .replace(/\/$/, "");

router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      customerName, email, phone, address, city, state, country, notes, pickupTransportCompany, pickupOtherLocation,
      paymentMethod = "paystack", distributorCode = "", deliveryMethod = "delivery",
    } = req.body;

    if (!["paystack", "cash_on_delivery", "distributor_transfer", "manual_bank_transfer"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Choose a valid payment method." });
    }
    const selectedPickupLocation = String(pickupTransportCompany || "").trim() === "Other / specify a transport company or park"
      ? String(pickupOtherLocation || "").trim()
      : String(pickupTransportCompany || "").trim();
    if (deliveryMethod === "delivery" && !selectedPickupLocation) {
      return res.status(400).json({ message: "Select the transport company or motor park you prefer." });
    }

    let distributor = null;
    if (distributorCode) {
      distributor = await User.findOne({ distributorCode: String(distributorCode).toUpperCase(), distributorStatus: "approved", isSuspended: { $ne: true }, isDeleted: { $ne: true } });
      if (!distributor) return res.status(400).json({ message: "The selected distributor is no longer available." });
    }
    if (paymentMethod === "distributor_transfer" && !distributor) return res.status(400).json({ message: "Bank transfer is available only through an approved distributor shop." });
    if (paymentMethod === "distributor_transfer" && (!distributor.distributorBankName || !distributor.distributorAccountNumber)) return res.status(400).json({ message: "This distributor has not completed payment details yet." });
    let storePaymentSettings = null;
    if (paymentMethod === "manual_bank_transfer") {
      storePaymentSettings = await StorePaymentSettings.findOne({ key: "default" });
      if (!storePaymentSettings?.manualTransferEnabled || !storePaymentSettings.bankName || !storePaymentSettings.accountName || !storePaymentSettings.accountNumber) {
        return res.status(400).json({ message: "Manual bank transfer is not available at the moment." });
      }
    }

    // 1. GET CART
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2. BUILD ORDER ITEMS
    let subtotal = 0;

    const validCartItems = cart.items.filter((item) => item.productId);

    if (validCartItems.length !== cart.items.length) {
      return res.status(400).json({
        message:
          "Some products in your cart no longer exist. Please remove them and try again.",
      });
    }

    const orderItems = validCartItems.map((item) => {
      const product = item.productId;

      const itemTotal = Number(product.price || 0) * item.quantity;

      subtotal += itemTotal;

      return {
        productId: product._id.toString(),
        name: product.name,
        image: product.coverImage,
        price: Number(product.price || 0),
        quantity: item.quantity,
      };
    });

    const shippingData = deliveryMethod === "pickup" ? { shippingAvailable: true, shippingFee: 0, serviceName: "Pickup", estimatedDays: "Ready after confirmation" } : await calculateShipping({ country, state, items: cart.items });

    if (shippingData.shippingAvailable === false) {
      return res.status(400).json({
        message:
          shippingData.message ||
          "Shipping is not available for the selected destination.",
      });
    }

    const shippingFee = shippingData.shippingFee || 0;

    const totalAmount = subtotal + shippingFee;
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const confirmationTokenHash = crypto
      .createHash("sha256")
      .update(confirmationToken)
      .digest("hex");

    let paymentReference;
    let authorizationUrl;

    // 3. Start Paystack only for online payments. COD orders go straight to confirmation.
    if (paymentMethod === "paystack") {
      const payment = await paystack.post("/transaction/initialize", {
        email,
        amount: totalAmount * 100,
        currency: "NGN",
        callback_url: `${clientUrl}/success?order_token=${confirmationToken}`,
        metadata: { userId, customerName, phone, state, country, notes, transportCompanyPickupPoint: selectedPickupLocation },
      });
      paymentReference = payment.data.data.reference;
      authorizationUrl = payment.data.data.authorization_url;
    }

    // 4. CREATE ORDER (pending) with valid payment reference
    const order = await Order.create({
      userId,
      distributorId: distributor?._id || null,
      distributorCode: distributor?.distributorCode || "",
      customerName,
      email,
      phone,
      address,
      city,
      state,
      notes,
      items: orderItems,
      subtotal,
      shippingFee,
      paymentStatus: "pending",
      deliveryStatus: "pending",
      deliveryFee: shippingFee,
      deliveryZone: country,
      deliveryMethod,
      pickupLocation: deliveryMethod === "pickup" ? (distributor?.distributorPickupAddress || "RESYIN Publications, Benin City") : "",
      transportCompanyPickupPoint: deliveryMethod === "delivery" ? selectedPickupLocation : "",
      paymentInstructions: paymentMethod === "distributor_transfer" ? `Transfer ₦${totalAmount.toLocaleString()} to ${distributor.distributorAccountName} · ${distributor.distributorAccountNumber} · ${distributor.distributorBankName}` : "",
      deliveryEstimate: shippingData.estimatedDays || "",
      shippingService: shippingData.serviceName || "",
      deliveryContact: phone,
      totalAmount,
      currency: "NGN",
      paymentMethod,
      cashCollectionStatus: paymentMethod === "cash_on_delivery" ? "pending_collection" : "not_applicable",
      manualTransferStatus: paymentMethod === "manual_bank_transfer" ? "pending_verification" : "not_applicable",
      paymentReference,
      confirmationTokenHash,
      confirmationTokenExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (paymentMethod === "manual_bank_transfer") {
      order.paymentInstructions = `Transfer ${totalAmount.toLocaleString()} NGN to ${storePaymentSettings.accountName} · ${storePaymentSettings.accountNumber} · ${storePaymentSettings.bankName}${storePaymentSettings.transferInstructions ? `. ${storePaymentSettings.transferInstructions}` : ""}`;
      await order.save();
    }
    if (paymentMethod === "cash_on_delivery") {
      order.paymentInstructions = "When the delivery agent arrives, make an online transfer to the official RESYIN Publications account sent to your WhatsApp or phone number. The agent confirms payment before handing over the order and does not collect cash.";
      await order.save();
    }

    // Create notification for user
    const orderNotif = await createNotification({
      userId,
      type: "order.created",
      title: paymentMethod === "paystack" ? "Payment required" : "Order Placed",
      body: paymentMethod === "cash_on_delivery"
        ? `Order #${order._id.toString().slice(-6).toUpperCase()} is pay on delivery. Transfer to the official RESYIN account when the agent arrives; payment must be confirmed before handover.`
        : paymentMethod === "manual_bank_transfer"
          ? `Your order #${order._id.toString().slice(-6).toUpperCase()} is awaiting bank-transfer verification.`
        : `Payment is incomplete for order #${order._id.toString().slice(-6).toUpperCase()}. Complete payment before delivery can begin.`,
      link: `/dashboard`,
      data: { orderId: order._id },
    });

    // Send push notification if subscribed
    if (orderNotif) {
      const unreadCount = await countUnreadNotifications(userId);

      await sendPushToUser(userId, {
        title: paymentMethod === "paystack" ? "Payment required" : "Order Placed",
        body: paymentMethod === "paystack" ? `Complete payment for order #${order._id.toString().slice(-6).toUpperCase()} before delivery can begin.` : `Your order #${order._id.toString().slice(-6).toUpperCase()} has been placed.`,
        link: `/dashboard`,
        badgeCount: unreadCount,
        data: { orderId: order._id },
      }).catch((err) => {
        console.warn("Push notification failed (non-critical):", err);
      });
    }

    if (["cash_on_delivery", "distributor_transfer", "manual_bank_transfer"].includes(paymentMethod)) {
      await Cart.findOneAndUpdate({ userId }, { items: [] });
      return res.json({
        checkoutType: paymentMethod,
        confirmation_url: `${clientUrl}/success?order_token=${confirmationToken}`,
        shipping: shippingData,
      });
    }

    res.json({
      checkoutType: "paystack",
      authorization_url: authorizationUrl,
      reference: paymentReference,
      shipping: shippingData,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      message: "Checkout failed",
    });
  }
});

module.exports = router;
