const express = require("express");

const router = express.Router();

const Notification = require("../models/Notification");
const { protect, adminOnly } = require("../middleware/auth");
const { sendPushToUser } = require("../services/push.service");

router.get("/pending", protect, adminOnly, async (req, res) => {
  try {
    const requests = await Notification.find({ status: "pending" }).sort({
      createdAt: -1,
    });

    res.json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notification requests" });
  }
});

router.put("/:id/approve", protect, adminOnly, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      status: "pending",
    });

    if (!notification) {
      return res
        .status(404)
        .json({ message: "Notification request not found" });
    }

    notification.status = "approved";
    notification.reviewedAt = Date.now();
    notification.reviewedBy = req.user._id;
    await notification.save();

    if (notification.userId) {
      await sendPushToUser(notification.userId, {
        title: notification.title,
        body: notification.body,
        link: notification.link,
        data: notification.data,
      });
    }

    res.json({ message: "Notification request approved", notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to approve notification request" });
  }
});

router.put("/:id/reject", protect, adminOnly, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      status: "pending",
    });

    if (!notification) {
      return res
        .status(404)
        .json({ message: "Notification request not found" });
    }

    notification.status = "rejected";
    notification.reviewedAt = Date.now();
    notification.reviewedBy = req.user._id;
    await notification.save();

    res.json({ message: "Notification request rejected", notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to reject notification request" });
  }
});

module.exports = router;
