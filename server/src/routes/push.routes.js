const express = require("express");
const { protect } = require("../middleware/auth");
const PushSubscription = require("../models/PushSubscription");

const router = express.Router();

// Get public VAPID key for push notification subscription
router.get("/vapid-public-key", (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(500).json({
      message:
        "VAPID public key not configured. Push notifications are unavailable.",
    });
  }

  res.json({ publicKey });
});

// Subscribe to push notifications
router.post("/subscribe", protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        message: "Invalid subscription object",
      });
    }

    // Save or update subscription in database
    const savedSubscription = await PushSubscription.findOneAndUpdate(
      { userId, endpoint: subscription.endpoint },
      {
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: req.headers["user-agent"],
      },
      { upsert: true, new: true },
    );

    res.json({
      success: true,
      message: "Successfully subscribed to push notifications",
      subscription: savedSubscription,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to subscribe to push notifications",
    });
  }
});

// Unsubscribe from push notifications
router.post("/unsubscribe", protect, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user.id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        message: "Invalid subscription object",
      });
    }

    // Remove subscription from database
    await PushSubscription.deleteOne({
      userId,
      endpoint: subscription.endpoint,
    });

    res.json({
      success: true,
      message: "Successfully unsubscribed from push notifications",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to unsubscribe from push notifications",
    });
  }
});

module.exports = router;
