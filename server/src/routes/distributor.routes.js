const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Product = require("../models/Product");
const DistributorInventory = require("../models/DistributorInventory");
const DistributorStockOrder = require("../models/DistributorStockOrder");
const User = require("../models/User");
const paystack = require("../services/paystack");
const { notifyAdmins } = require("../services/notification.service");
const { sendPushToAdmins } = require("../services/push.service");

const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");

function approved(req, res, next) {
  if (req.user?.distributorStatus !== "approved") return res.status(403).json({ message: "Distributor approval is required." });
  next();
}

async function verifyDistributorAccount(bankCode, accountNumber) {
  const normalizedNumber = String(accountNumber || "").replace(/\D/g, "");
  if (!bankCode || normalizedNumber.length !== 10) {
    const error = new Error("Select a bank and enter a valid 10-digit account number.");
    error.status = 400;
    throw error;
  }
  try {
    const response = await paystack.get("/bank/resolve", { params: { bank_code: bankCode, account_number: normalizedNumber } });
    const account = response.data?.data;
    if (!account?.account_name) throw new Error("This account could not be verified.");
    return { accountName: account.account_name, accountNumber: String(account.account_number || normalizedNumber).replace(/\D/g, "") };
  } catch (error) {
    if (error.status) throw error;
    const resolvedError = new Error(error.response?.data?.message || "This account could not be verified.");
    resolvedError.status = 400;
    throw resolvedError;
  }
}

router.get("/store/:code", async (req, res) => {
  const distributor = await User.findOne({ distributorCode: req.params.code.toUpperCase(), distributorStatus: "approved", isSuspended: { $ne: true }, isDeleted: { $ne: true } }).select("name distributorCode city state distributorBankName distributorAccountName distributorAccountNumber distributorPickupAddress distributorPickupEnabled distributorDeliveryEnabled").lean();
  if (!distributor) return res.status(404).json({ message: "This distributor shop is unavailable." });
  const inventory = await DistributorInventory.find({ distributorId: distributor._id, quantity: { $gt: 0 } }).populate("productId", "name coverImage price salePrice shortDescription stock status approved hidden").lean();
  res.json({ distributor, products: inventory.map((item) => ({ ...item.productId, distributorAvailable: item.quantity })).filter((product) => product && product.status === "active" && product.approved !== false && product.hidden !== true) });
});

router.get("/catalog", protect, approved, async (req, res) => {
  const products = await Product.find({ status: "active", approved: { $ne: false }, hidden: { $ne: true }, distributorPrice: { $ne: null } })
    .select("name coverImage price distributorPrice distributorMinimumQuantity stock shortDescription").lean();
  res.json(products.filter((p) => Number(p.distributorPrice) >= 0));
});

router.get("/dashboard", protect, approved, async (req, res) => {
  const inventory = await DistributorInventory.find({ distributorId: req.user._id }).populate("productId", "name coverImage price distributorPrice stock").lean();
  const orders = await DistributorStockOrder.find({ distributorId: req.user._id }).sort({ createdAt: -1 }).limit(20).lean();
  res.json({
    distributorCode: req.user.distributorCode,
    inventory: inventory.filter((item) => item.productId),
    orders,
    settings: {
      bankName: req.user.distributorBankName || "",
      bankCode: req.user.distributorBankCode || "",
      accountName: req.user.distributorAccountName || "",
      accountNumber: req.user.distributorAccountNumber || "",
      pickupAddress: req.user.distributorPickupAddress || "",
      pickupEnabled: req.user.distributorPickupEnabled !== false,
      deliveryEnabled: req.user.distributorDeliveryEnabled !== false,
    },
  });
});

router.post("/stock-orders", protect, approved, async (req, res) => {
  const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
  if (!requestedItems.length) return res.status(400).json({ message: "Choose at least one product." });
  const ids = requestedItems.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: ids }, status: "active", distributorPrice: { $ne: null } });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  let totalAmount = 0;
  const items = [];
  for (const requested of requestedItems) {
    const product = byId.get(String(requested.productId));
    const quantity = Number(requested.quantity);
    if (!product || !Number.isSafeInteger(quantity) || quantity < Number(product.distributorMinimumQuantity || 1)) return res.status(400).json({ message: "One or more stock quantities do not meet the distributor minimum." });
    if (product.stock < quantity) return res.status(400).json({ message: `${product.name} does not have enough central stock.` });
    const unitPrice = Number(product.distributorPrice);
    items.push({ productId: product._id, name: product.name, quantity, unitPrice });
    totalAmount += unitPrice * quantity;
  }
  const payment = await paystack.post("/transaction/initialize", { email: req.user.email, amount: totalAmount * 100, currency: "NGN", callback_url: `${clientUrl}/distributor?stock_payment=processing`, metadata: { distributorId: String(req.user._id), type: "distributor_stock" } });
  const stockOrder = await DistributorStockOrder.create({ distributorId: req.user._id, items, totalAmount, paymentReference: payment.data.data.reference });
  res.json({ authorization_url: payment.data.data.authorization_url, reference: stockOrder.paymentReference });
});

router.post("/sales", protect, approved, async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const amount = Number(quantity);
  if (!productId || !Number.isSafeInteger(amount) || amount < 1) return res.status(400).json({ message: "Enter a valid quantity." });
  const inventory = await DistributorInventory.findOneAndUpdate({ distributorId: req.user._id, productId, quantity: { $gte: amount } }, { $inc: { quantity: -amount, unitsSold: amount } }, { new: true });
  if (!inventory) return res.status(400).json({ message: "You do not have enough distributor stock for this sale." });
  res.json(inventory);
});

router.post("/apply", protect, async (req, res) => {
  if (req.user.distributorStatus === "approved") return res.json({ message: "Your distributor account is already approved." });
  if (req.user.distributorStatus === "pending") return res.json({ message: "Your distributor application is already pending admin approval." });
  const { businessName, phone, pickupAddress, deliveryCoverage, bankName, bankCode, accountNumber, note } = req.body;
  if (!businessName || !phone || !pickupAddress || !bankName || !bankCode || !accountNumber) {
    return res.status(400).json({ message: "Business name, phone, pickup address, and bank details are required." });
  }
  let verifiedAccount;
  try { verifiedAccount = await verifyDistributorAccount(bankCode, accountNumber); }
  catch (error) { return res.status(error.status || 400).json({ message: error.message }); }
  req.user.distributorStatus = "pending";
  req.user.distributorBusinessName = String(businessName).trim();
  req.user.phone = String(phone).trim();
  req.user.distributorPickupAddress = String(pickupAddress).trim();
  req.user.distributorDeliveryCoverage = String(deliveryCoverage || "").trim();
  req.user.distributorBankName = String(bankName).trim();
  req.user.distributorBankCode = String(bankCode).trim();
  req.user.distributorAccountName = verifiedAccount.accountName;
  req.user.distributorAccountNumber = verifiedAccount.accountNumber;
  req.user.distributorApplicationNote = String(note || "").trim();
  await req.user.save();

  const admins = await User.find({ role: "admin" }).select("_id");
  const adminIds = admins.map((admin) => admin._id);
  if (adminIds.length > 0) {
    const notificationPayload = {
      type: "distributor.application.submitted",
      title: "New Distributor Application",
      body: `${req.user.name || req.user.email} submitted a distributor application for review.`,
      link: "/admin/users",
      data: { userId: req.user._id },
    };
    await notifyAdmins(notificationPayload, adminIds);
    await sendPushToAdmins(adminIds, notificationPayload);
  }

  res.json({ message: "Distributor application submitted for review." });
});

router.put("/settings", protect, approved, async (req, res) => {
  const { bankName, bankCode, accountNumber, pickupAddress, pickupEnabled, deliveryEnabled } = req.body;
  let verifiedAccount;
  try { verifiedAccount = await verifyDistributorAccount(bankCode, accountNumber); }
  catch (error) { return res.status(error.status || 400).json({ message: error.message }); }
  req.user.distributorBankName = String(bankName || "").trim();
  req.user.distributorBankCode = String(bankCode || "").trim();
  req.user.distributorAccountName = verifiedAccount.accountName;
  req.user.distributorAccountNumber = verifiedAccount.accountNumber;
  req.user.distributorPickupAddress = String(pickupAddress || "").trim();
  req.user.distributorPickupEnabled = pickupEnabled !== false;
  req.user.distributorDeliveryEnabled = deliveryEnabled !== false;
  await req.user.save();
  res.json({ message: "Distributor settings saved." });
});

module.exports = router;
