//server/src/routes/paystack.webhook.routes.js
const express = require("express");

const crypto = require("crypto");

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Cart = require("../models/Cart");
const DistributorStockOrder = require("../models/DistributorStockOrder");
const DistributorInventory = require("../models/DistributorInventory");
const PublisherSubscriptionPayment = require("../models/PublisherSubscriptionPayment");
const PublisherSubscriptionSettings = require("../models/PublisherSubscriptionSettings");
const {
  createNotification,
  countUnreadNotifications,
  notifyAdmins,
} = require("../services/notification.service");
const {
  sendPushToUser,
  sendPushToAdmins,
} = require("../services/push.service");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    // When using express.raw for this route, req.body is a Buffer containing
    // the raw JSON payload. Compute the HMAC on the raw bytes to match Paystack's signature.
    const rawBody = req.body;

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== req.headers["x-paystack-signature"]) {
      return res.status(401).json({
        message: "Invalid signature",
      });
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString());
    } catch (parseErr) {
      console.error("Failed to parse webhook body", parseErr);
      return res.status(400).json({ message: "Invalid payload" });
    }

    if (event.event === "charge.success") {
      const reference = event.data.reference;

      const subscriptionPayment = await PublisherSubscriptionPayment.findOne({ reference });
      if (subscriptionPayment) {
        if (subscriptionPayment.status === "paid") return res.json({ received: true });
        if (event.data.status !== "success"
          || String(event.data.currency || "").toUpperCase() !== String(subscriptionPayment.currency).toUpperCase()
          || Number(event.data.amount) !== Math.round(Number(subscriptionPayment.amount) * 100)) {
          return res.status(400).json({ message: "Subscription payment does not match." });
        }

        const [user, settings] = await Promise.all([
          User.findById(subscriptionPayment.userId),
          PublisherSubscriptionSettings.findOne({ key: "default" }).lean(),
        ]);
        if (!user || !settings?.enabled) return res.status(400).json({ message: "Publisher subscription is unavailable." });

        const base = user.publisherSubscriptionExpiresAt && user.publisherSubscriptionExpiresAt > new Date()
          ? user.publisherSubscriptionExpiresAt
          : new Date();
        user.publisherStatus = "approved";
        user.publisherSubscriptionExpiresAt = new Date(base.getTime() + Number(settings.subscriptionDays || 365) * 24 * 60 * 60 * 1000);
        subscriptionPayment.status = "paid";
        subscriptionPayment.paidAt = new Date();
        await Promise.all([user.save(), subscriptionPayment.save()]);
        await createNotification({ userId: user._id, type: "publisher.subscription.activated", title: "Publisher subscription activated", body: `Your publisher subscription is active until ${user.publisherSubscriptionExpiresAt.toISOString().slice(0, 10)}. You can now submit books.`, link: "/publish-with-us" });
        return res.json({ received: true });
      }

      const distributorOrder = await DistributorStockOrder.findOne({ paymentReference: reference });
      if (distributorOrder) {
        if (distributorOrder.paymentStatus === "paid") return res.json({ received: true });
        for (const item of distributorOrder.items) {
          const product = await Product.findOneAndUpdate({ _id: item.productId, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { new: true });
          if (!product) {
            distributorOrder.paymentStatus = "failed";
            await distributorOrder.save();
            return res.status(409).json({ message: "Central stock is no longer available." });
          }
          await DistributorInventory.findOneAndUpdate(
            { distributorId: distributorOrder.distributorId, productId: item.productId },
            { $inc: { quantity: item.quantity } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          );
        }
        distributorOrder.paymentStatus = "paid";
        distributorOrder.fulfilledAt = new Date();
        await distributorOrder.save();
        return res.json({ received: true });
      }

      const order = await Order.findOne({
        $or: [{ paymentReference: reference }, { paymentReferences: reference }],
      });

      if (!order) {
        return res.json({
          received: true,
        });
      }

      // prevent double stock deduction
      if (order.paymentStatus === "paid") {
        return res.json({
          received: true,
        });
      }

      // A valid signature proves Paystack sent the event; these checks ensure
      // that the event is also for this exact order rather than merely sharing
      // a reference field.
      if (event.data.status !== "success"
        || String(event.data.currency || "").toUpperCase() !== String(order.currency || "NGN").toUpperCase()
        || Number(event.data.amount) !== Math.round(Number(order.totalAmount || 0) * 100)) {
        console.error("Paystack order mismatch", { reference, orderId: order._id, amount: event.data.amount, currency: event.data.currency });
        return res.status(400).json({ message: "Payment does not match the order." });
      }

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
            return res.status(409).json({ message: "Distributor stock is no longer available." });
          }
          continue;
        }
        const product = await Product.findById(item.productId);

        if (!product) continue;

        const edition = product.editions?.find((candidate) => candidate.format === (item.format || item.editionKey));
        if (edition) {
          edition.stock = Math.max(0, Number(edition.stock || 0) - item.quantity);
        } else {
          product.stock = Math.max(0, product.stock - item.quantity);
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
    }

    res.json({
      received: true,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Webhook error",
    });
  }
});

module.exports = router;
