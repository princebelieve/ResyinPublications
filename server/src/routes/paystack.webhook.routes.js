//server/src/routes/paystack.webhook.routes.js
const express = require("express");

const crypto = require("crypto");

const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Cart = require("../models/Cart");
const DistributorStockOrder = require("../models/DistributorStockOrder");
const DistributorInventory = require("../models/DistributorInventory");
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
        paymentReference: reference,
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

        product.stock = Math.max(0, product.stock - item.quantity);

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
