const express = require("express");
const upload = require("../middleware/upload");
const { protect } = require("../middleware/auth");
const { createProduct } = require("../controllers/product.controller");
const PublisherSubscriptionSettings = require("../models/PublisherSubscriptionSettings");
const User = require("../models/User");
const Order = require("../models/Order");
const paystack = require("../services/paystack");
const { createNotification, notifyAdminTeam } = require("../services/notification.service");
const { sendPushToUser } = require("../services/push.service");

const router = express.Router();

async function verifyAccount(bankCode, accountNumber) {
  const normalizedNumber = String(accountNumber || "").replace(/\D/g, "");
  if (!bankCode || normalizedNumber.length !== 10) throw Object.assign(new Error("Select a bank and enter a valid 10-digit account number."), { status: 400 });
  try {
    const response = await paystack.get("/bank/resolve", { params: { bank_code: bankCode, account_number: normalizedNumber } });
    const account = response.data?.data;
    if (!account?.account_name) throw new Error("This account could not be verified.");
    return { accountName: account.account_name, accountNumber: String(account.account_number || normalizedNumber).replace(/\D/g, "") };
  } catch (error) {
    throw Object.assign(new Error(error.response?.data?.message || error.message || "This account could not be verified."), { status: 400 });
  }
}

router.post("/apply", protect, async (req, res) => {
  const { bankName, bankCode, accountNumber, note } = req.body;
  if (!bankName || !bankCode || !accountNumber) return res.status(400).json({ message: "Publisher bank details are required." });
  try {
    const account = await verifyAccount(bankCode, accountNumber);
    req.user.publisherStatus = "pending";
    req.user.publisherBankName = String(bankName).trim();
    req.user.publisherBankCode = String(bankCode).trim();
    req.user.publisherAccountName = account.accountName;
    req.user.publisherAccountNumber = account.accountNumber;
    req.user.publisherApplicationNote = String(note || "").trim();
    await req.user.save();
    await notifyAdminTeam({ type: "publisher.application.submitted", title: "Publisher application submitted", body: `${req.user.name || req.user.email} submitted publisher details for annual subscription approval.`, link: "/admin/users", data: { userId: req.user._id } });
    res.json({ message: "Publisher application submitted. An administrator must confirm your annual subscription before you can upload books." });
  } catch (error) {
    res.status(error.status || 400).json({ message: error.message });
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
