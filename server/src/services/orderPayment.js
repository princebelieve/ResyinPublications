const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Cart = require("../models/Cart");
const DistributorInventory = require("../models/DistributorInventory");
const {
  createNotification,
  countUnreadNotifications,
  notifyAdmins,
} = require("../services/notification.service");
const {
  sendPushToUser,
} = require("../services/push.service");


async function confirmOrderPayment(data) {
  const reference = data.reference;
  const order = await Order.findOne({
    $or: [{ paymentReference: reference }, { paymentReferences: reference }],
  });

  if (!order) {
    return order;
  }

  // prevent double stock deduction
  if (!["pending", "failed"].includes(order.paymentStatus)) {
    return order;
  }

  // Both signed webhooks and server-side verification must match the order.
  if (data.status !== "success"
    || String(data.currency || "").toUpperCase() !== String(order.currency || "NGN").toUpperCase()
    || Number(data.amount) !== Math.round(Number(order.totalAmount || 0) * 100)) {
    console.error("Paystack order mismatch", { reference, orderId: order._id, amount: data.amount, currency: data.currency });
    throw new Error("Payment does not match the order.");
  }

  const claimed = await Order.findOneAndUpdate({
    _id: order._id, paymentStatus: { $in: ["pending", "failed"] },
    $or: [{ paymentProcessingUntil: { $exists: false } }, { paymentProcessingUntil: null }, { paymentProcessingUntil: { $lt: new Date() } }],
  }, { $set: { paymentProcessingUntil: new Date(Date.now() + 120000) } });
  if (!claimed) return Order.findById(order._id);
  try {
    order.paymentStatus = "paid";

    order.deliveryStatus = "confirmed";

    order.paidAt = new Date();

    order.statusHistory.push({
      status: "confirmed",
    });

    // Deduct from distributor stock when this customer entered through a distributor shop.
    const LOW_STOCK_THRESHOLD = 5;
    for (const item of order.items) {
      if (order.distributorId) {
        const inventory = await DistributorInventory.findOneAndUpdate({ distributorId: order.distributorId, productId: item.productId, quantity: { $gte: item.quantity } }, { $inc: { quantity: -item.quantity, unitsSold: item.quantity } }, { new: true });
        if (!inventory) {
          order.paymentStatus = "failed";
          await order.save();
          throw new Error("Distributor stock is no longer available.");
        }
        continue;
      }
      const product = await Product.findById(item.productId);

      if (!product) continue;

      if (["pdf", "epub"].includes(String(item.format || item.editionKey).toLowerCase())) {
        product.soldCount = (product.soldCount || 0) + item.quantity;
        await product.save();
        continue;
      }

      const edition = product.editions?.find((candidate) => candidate.format === (item.format || item.editionKey));
      if (edition) {
        edition.stock = Math.max(0, Number(edition.stock || 0) - item.quantity);
        // Keep legacy product-level availability in sync with physical
        // editions so catalog cards and low-stock reporting do not disagree.
        const physicalFormats = new Set(["paperback", "hardcover"]);
        product.stock = (product.editions || [])
          .filter((candidate) => physicalFormats.has(String(candidate.format).toLowerCase()))
          .reduce((total, candidate) => total + Number(candidate.stock || 0), 0);
        product.inStock = product.stock > 0;
      } else {
        product.stock = Math.max(0, product.stock - item.quantity);
        product.inStock = product.stock > 0;
      }

      product.soldCount = (product.soldCount || 0) + item.quantity;

      await product.save();

      // Check for low stock alert
      if (product.stock <= LOW_STOCK_THRESHOLD && product.stock > 0) {
        const admins = await User.find({ role: "admin" }).select("_id");
        const adminIds = admins.map((admin) => admin._id);

        if (adminIds.length > 0) {
          await notifyAdmins(
            {
              type: "stock.alert",
              title: "Low Stock Alert",
              body: `Product "${product.name}" has low stock: ${product.stock} unit(s) remaining.`,
              link: `/admin/products/edit/${product._id}`,
              data: { productId: product._id, stock: product.stock },
            },
            adminIds,
          );
        }
      }
    }

    await order.save();

    await Cart.findOneAndUpdate({ userId: order.userId }, { items: [] });

    // Create notification for user
    const paymentNotif = await createNotification({
      userId: order.userId,
      type: "payment.confirmed",
      title: "Payment Confirmed",
      body: `Payment for order #${order._id.toString().slice(-6).toUpperCase()} has been confirmed. Your order is now being processed.`,
      link: `/dashboard`,
      data: { orderId: order._id },
    });

    // Send push notification for payment confirmation
    if (paymentNotif) {
      const unreadCount = await countUnreadNotifications(order.userId);

      await sendPushToUser(order.userId, {
        title: "Payment Confirmed",
        body: `Payment for order #${order._id.toString().slice(-6).toUpperCase()} confirmed. Processing order.`,
        link: `/dashboard`,
        badgeCount: unreadCount,
        data: { orderId: order._id },
      }).catch((err) => {
        console.warn("Push notification failed (non-critical):", err);
      });
    }

    console.log("✅ PAYMENT CONFIRMED:", reference);
    return order;
  } finally {
    await Order.updateOne({ _id: order._id }, { $unset: { paymentProcessingUntil: 1 } });
  }

}

async function verifyOrderPayment(order) {
  if (order.paymentMethod !== "paystack" || !["pending", "failed"].includes(order.paymentStatus)) {
    return { order, canRetry: false };
  }
  const references = [...new Set([order.paymentReference, ...(order.paymentReferences || [])].filter(Boolean))];
  let canRetry = references.length > 0;
  for (const reference of references) {
    const response = await require("./paystack").get(`/transaction/verify/${encodeURIComponent(reference)}`, { timeout: 15000 });
    const data = response.data?.data;
    if (!response.data?.status || !data || data.reference !== reference) {
      throw new Error("Unable to verify this payment. Please try checking again.");
    }
    if (data.status === "success") {
      return { order: await confirmOrderPayment(data), canRetry: false };
    }
    // An ongoing transfer must not invite another debit.
    if (!["failed", "abandoned"].includes(data.status)) canRetry = false;
  }
  return { order, canRetry };
}

module.exports = { confirmOrderPayment, verifyOrderPayment };
