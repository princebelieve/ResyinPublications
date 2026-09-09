//server/src/routes/admin.order.routes.js
const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const { protect, adminOnly } = require("../middleware/auth");
const {
  createNotification,
  countUnreadNotifications,
} = require("../services/notification.service");
const { sendPushToUser } = require("../services/push.service");

// GET ALL ORDERS OR ARCHIVED ORDERS
router.get("/", protect, adminOnly, async (req, res) => {
  const archived = req.query.archived === "true";

  const filter = {
    archived: archived ? true : { $ne: true },
  };

  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

  if (startDate && !isNaN(startDate.getTime())) {
    filter.createdAt = filter.createdAt || {};
    filter.createdAt.$gte = startDate;
  }

  if (endDate && !isNaN(endDate.getTime())) {
    const inclusiveEnd = new Date(endDate);
    inclusiveEnd.setHours(23, 59, 59, 999);
    filter.createdAt = filter.createdAt || {};
    filter.createdAt.$lte = inclusiveEnd;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders);
});

// ARCHIVE ALL ORDERS
router.put("/archive-all", protect, adminOnly, async (req, res) => {
  const result = await Order.updateMany(
    { archived: { $ne: true } },
    { archived: true },
  );

  res.json({
    archivedCount: result.modifiedCount || result.nModified || 0,
  });
});

// GET SINGLE ORDER
router.get("/:id", protect, adminOnly, async (req, res) => {
  const order = await Order.findById(req.params.id);
  res.json(order);
});

// UPDATE DELIVERY STATUS
router.put("/:id/status", protect, adminOnly, async (req, res) => {
  const { deliveryStatus } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ message: "Order not found" });

  const fulfilmentStatuses = ["confirmed", "processing", "ready_for_dispatch", "shipped", "out_for_delivery", "delivered"];
  if (fulfilmentStatuses.includes(deliveryStatus) && order.paymentStatus !== "paid") {
    return res.status(400).json({ message: "Payment must be confirmed before this order can be prepared or dispatched." });
  }

  const oldStatus = order.deliveryStatus;
  order.deliveryStatus = deliveryStatus;

  order.statusHistory.push({
    status: deliveryStatus,
  });

  await order.save();

  // Create notification based on delivery status
  const statusMessages = {
    pending: "Your order is being processed.",
    confirmed: "Payment confirmed. Your order is being prepared.",
    shipped: "Your order has been shipped! Track your delivery.",
    in_transit: "Your order is on the way to you.",
    delivered: "Your order has been delivered. Thank you for your purchase!",
    cancelled: "Your order has been cancelled.",
    failed: "There was an issue with your order. Please contact support.",
  };

  if (oldStatus !== deliveryStatus && statusMessages[deliveryStatus]) {
    const orderNotif = await createNotification({
      userId: order.userId,
      type: `order.${deliveryStatus}`,
      title: `Order ${deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}`,
      body: `Order #${order._id.toString().slice(-6).toUpperCase()}: ${statusMessages[deliveryStatus]}`,
      link: `/dashboard`,
      data: { orderId: order._id },
    });

    // Send push notification for delivery status update
    if (orderNotif) {
      const unreadCount = await countUnreadNotifications(order.userId);

      await sendPushToUser(order.userId, {
        title: `Order ${deliveryStatus.charAt(0).toUpperCase() + deliveryStatus.slice(1)}`,
        body: statusMessages[deliveryStatus],
        link: `/dashboard`,
        badgeCount: unreadCount,
        data: { orderId: order._id },
      }).catch((err) => {
        console.warn("Push notification failed (non-critical):", err);
      });
    }
  }

  res.json(order);
});

// MARK CASH AS COLLECTED FOR A PAY-ON-DELIVERY ORDER
router.put("/:id/cash-collected", protect, adminOnly, async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.paymentMethod !== "cash_on_delivery") {
    return res.status(400).json({ message: "This order is not a pay-on-delivery order." });
  }

  order.paymentStatus = "paid";
  order.cashCollectionStatus = "payment_confirmed";
  order.paidAt = order.paidAt || new Date();
  order.deliveryStatus = order.deliveryStatus === "pending" ? "confirmed" : order.deliveryStatus;
  order.statusHistory.push({ status: "payment_confirmed_before_handover" });
  await order.save();

  res.json(order);
});

router.put("/:id/verify-manual-transfer", protect, adminOnly, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (order.paymentMethod !== "manual_bank_transfer") return res.status(400).json({ message: "This order is not a manual bank transfer order." });
  order.paymentStatus = "paid";
  order.manualTransferStatus = "verified";
  order.paidAt = order.paidAt || new Date();
  order.deliveryStatus = order.deliveryStatus === "pending" ? "confirmed" : order.deliveryStatus;
  order.statusHistory.push({ status: "payment_verified" });
  await order.save();
  res.json(order);
});

// ARCHIVE ORDER
router.put("/:id/archive", protect, adminOnly, async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) return res.status(404).json({ message: "Order not found" });

  order.archived = true;
  await order.save();

  // Notify user that order has been archived/cancelled
  const archiveNotif = await createNotification({
    userId: order.userId,
    type: "order.archived",
    title: "Order Archived",
    body: `Order #${order._id.toString().slice(-6).toUpperCase()} has been archived.`,
    link: `/dashboard`,
    data: { orderId: order._id },
  });

  // Send push notification for order archival
  if (archiveNotif) {
    const unreadCount = await countUnreadNotifications(order.userId);

    await sendPushToUser(order.userId, {
      title: "Order Archived",
      body: `Order #${order._id.toString().slice(-6).toUpperCase()} has been archived.`,
      link: `/dashboard`,
      badgeCount: unreadCount,
      data: { orderId: order._id },
    }).catch((err) => {
      console.warn("Push notification failed (non-critical):", err);
    });
  }

  res.json(order);
});

module.exports = router;
