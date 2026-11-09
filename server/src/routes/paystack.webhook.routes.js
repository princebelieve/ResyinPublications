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

const { confirmOrderPayment } = require("../services/orderPayment");

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

      await confirmOrderPayment(event.data);
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
