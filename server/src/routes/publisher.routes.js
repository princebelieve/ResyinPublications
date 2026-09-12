const express = require("express");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const { createProduct } = require("../controllers/product.controller");
const PublisherSubscriptionSettings = require("../models/PublisherSubscriptionSettings");
const User = require("../models/User");
const Order = require("../models/Order");
const Product = require("../models/Product");
const PublisherSubscriptionPayment = require("../models/PublisherSubscriptionPayment");
const paystack = require("../services/paystack");
const { createNotification, notifyAdminTeam } = require("../services/notification.service");
const { sendPushToUser } = require("../services/push.service");

const router = express.Router();

const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");

async function beginSubscriptionPayment(user) {
  const settings = await PublisherSubscriptionSettings.findOne({ key: "default" }).lean();
  if (!settings?.enabled || Number(settings.annualFee) <= 0) throw new Error("Publisher subscriptions are not available at the moment.");

  const payment = await paystack.post("/transaction/initialize", {
    email: user.email,
    amount: Math.round(Number(settings.annualFee) * 100),
    currency: settings.currency || "NGN",
    callback_url: `${clientUrl}/publish-with-us?subscription_payment=complete`,
    metadata: { userId: String(user._id), paymentType: "publisher_subscription" },
  });
  const reference = payment.data.data.reference;
  await PublisherSubscriptionPayment.create({ userId: user._id, reference, amount: Number(settings.annualFee), currency: settings.currency || "NGN" });
  return payment.data.data.authorization_url;
}

router.post("/apply", protect, async (req, res) => {
  const { publisherName, publisherType, website, bio, note } = req.body;

  if (!publisherName || !publisherType) {
    return res.status(400).json({ message: "Please enter your publishing name and publishing type." });
  }

  try {
    req.user.publisherStatus = "pending";
    req.user.publisherName = String(publisherName).trim();
    req.user.publisherType = String(publisherType).trim();
    req.user.publisherWebsite = String(website || "").trim();
    req.user.publisherBio = String(bio || "").trim();
    req.user.publisherApplicationNote = String(note || "").trim();

    await req.user.save();
    await notifyAdminTeam({
      type: "publisher.application.submitted",
      title: "Publisher application submitted",
      body: `${req.user.name || req.user.email} submitted a publisher application for review.`,
      link: "/admin/users",
      data: { userId: req.user._id },
    });

    const authorization_url = await beginSubscriptionPayment(req.user);
    res.json({ authorization_url, message: "Continue to Paystack to activate your publisher subscription." });
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to submit publisher application." });
  }
});

router.post("/subscription/renew", protect, async (req, res) => {
  try {
    const authorization_url = await beginSubscriptionPayment(req.user);
    res.json({ authorization_url });
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to start subscription payment." });
  }
});

router.put("/payment-account", protect, async (req, res) => {
  const { bankName, bankCode, accountNumber, accountName, paymentInstructions } = req.body;
  const normalizedBankName = String(bankName || "").trim();
  const normalizedBankCode = String(bankCode || "").trim();
  const normalizedAccountNumber = String(accountNumber || "").replace(/\D/g, "");
  const normalizedAccountName = String(accountName || "").trim();

  if (!normalizedBankName || !normalizedBankCode || normalizedAccountNumber.length !== 10) {
    return res.status(400).json({ message: "Select a valid bank and enter a 10-digit account number." });
  }

  if (!normalizedAccountName) {
    return res.status(400).json({ message: "Enter the exact account holder name for the direct payment account." });
  }

  try {
    req.user.publisherBankName = normalizedBankName;
    req.user.publisherBankCode = normalizedBankCode;
    req.user.publisherAccountName = normalizedAccountName;
    req.user.publisherAccountNumber = normalizedAccountNumber;
    req.user.publisherPaymentInstructions = String(paymentInstructions || "").trim();
    await req.user.save();

    res.json({
      message: "Direct payment account saved.",
      account: {
        bankName: req.user.publisherBankName,
        bankCode: req.user.publisherBankCode,
        accountName: req.user.publisherAccountName,
        accountNumber: req.user.publisherAccountNumber,
        paymentInstructions: req.user.publisherPaymentInstructions,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message || "Unable to save publisher payment account." });
  }
});

router.post("/orders/:id/confirm-payment", protect, async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, items: { $elemMatch: { publisherId: String(req.user._id), publisherPaymentStatus: "pending_confirmation" } } });
  if (!order) return res.status(404).json({ message: "No publisher payment is awaiting your confirmation." });
  let confirmed = 0;
  order.items.forEach((item) => {
    if (item.publisherId === String(req.user._id) && item.publisherPaymentStatus === "pending_confirmation") {
      item.publisherPaymentStatus = "confirmed";
      confirmed += 1;
    }
  });
  if (confirmed > 0) {
    for (const item of order.items) {
      if (item.publisherId !== String(req.user._id)) continue;
      const product = await Product.findById(item.productId);
      if (!product) continue;
      const edition = product.editions?.find((candidate) => candidate.format === (item.format || item.editionKey));
      if (edition && !["pdf", "epub"].includes(String(edition.format).toLowerCase())) {
        edition.stock = Math.max(0, Number(edition.stock || 0) - Number(item.quantity || 0));
        product.stock = (product.editions || [])
          .filter((candidate) => ["paperback", "hardcover"].includes(String(candidate.format).toLowerCase()))
          .reduce((total, candidate) => total + Number(candidate.stock || 0), 0);
        product.inStock = product.stock > 0;
      }
      product.soldCount = Number(product.soldCount || 0) + Number(item.quantity || 0);
      await product.save();
    }
    order.paymentStatus = "paid";
    order.paidAt = order.paidAt || new Date();
    order.manualTransferStatus = "verified";
    if (order.deliveryStatus === "pending") order.deliveryStatus = "confirmed";
    order.statusHistory.push({ status: "publisher_payment_confirmed" });
  }
  await order.save();
  await createNotification({ userId: order.userId, type: "publisher.payment.confirmed", title: "Publisher confirmed your payment", body: `Payment for order #${order._id.toString().slice(-6).toUpperCase()} has been confirmed. Your book access and fulfilment can proceed.`, link: "/dashboard", data: { orderId: order._id } });
  await sendPushToUser(order.userId, { title: "Publisher confirmed your payment", body: `Your payment for order #${order._id.toString().slice(-6).toUpperCase()} was confirmed.`, link: "/dashboard", data: { orderId: order._id, type: "publisher.payment.confirmed" } }).catch(() => {});
  res.json({ message: `${confirmed} book payment${confirmed === 1 ? "" : "s"} confirmed.`, order });
});

router.get("/orders/pending", protect, async (req, res) => {
  const orders = await Order.find({ "items": { $elemMatch: { publisherId: String(req.user._id), publisherPaymentStatus: "pending_confirmation" } } }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

router.post(
  "/submissions",
  protect,
  async (req, res, next) => {
    const settings = await PublisherSubscriptionSettings.findOne({ key: "default" }).lean();
    if (!settings?.enabled || req.user.publisherStatus !== "approved" || !req.user.publisherSubscriptionExpiresAt || req.user.publisherSubscriptionExpiresAt <= new Date()) return res.status(403).json({ message: "An active, administrator-approved publisher subscription is required before uploading books." });
    return next();
  },
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 20 },
    { name: "pdfFile", maxCount: 1 },
    { name: "epubFile", maxCount: 1 },
  ]),
  (req, res, next) => {
    req.publisherSubmission = true;
    return createProduct(req, res, next);
  },
);

module.exports = router;
