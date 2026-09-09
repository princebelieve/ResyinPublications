const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");
const Notification = require("../models/Notification");
const { sendPushToUser, sendPushToUsers } = require("../services/push.service");

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const filter = {
      userId: req.user.id,
      status: "approved",
    };

    if (typeof req.query.archived !== "undefined") {
      filter.archived = req.query.archived === "true";
    }

    if (typeof req.query.read !== "undefined") {
      filter.read = req.query.read === "true";
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

router.get("/requests", protect, async (req, res) => {
  try {
    const filter = { status: "pending" };

    if (req.user.role === "subadmin") {
      filter.senderId = req.user.id;
    }

    const requests = await Notification.find(filter).sort({
      createdAt: -1,
    });

    res.json({ requests });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notification requests" });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { userId, type, title, body, link, data } = req.body;

    if (req.user.role !== "admin" && req.user.role !== "subadmin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const isSubadmin = req.user.role === "subadmin";

    const notification = await Notification.create({
      userId: userId || undefined,
      type,
      title,
      body,
      link,
      data,
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      status: isSubadmin ? "pending" : "approved",
      requestedAt: isSubadmin ? Date.now() : undefined,
      reviewedAt: isSubadmin ? undefined : Date.now(),
      reviewedBy: isSubadmin ? undefined : req.user._id,
    });

    if (!isSubadmin && notification.userId) {
      await sendPushToUser(notification.userId, {
        title: notification.title,
        body: notification.body,
        link: notification.link,
        data: notification.data,
      });
    }

    res.status(isSubadmin ? 202 : 201).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create notification" });
  }
});

// Broadcast notification to all users
router.post("/broadcast/all", protect, async (req, res) => {
  try {
    const { type, title, body, link, data } = req.body;

    if (req.user.role !== "admin" && req.user.role !== "subadmin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const User = require("../models/User");
    const isSubadmin = req.user.role === "subadmin";

    // Get all active (non-deleted, non-suspended) users
    const users = await User.find({
      isDeleted: false,
      isSuspended: false,
    }).select("_id");

    if (users.length === 0) {
      return res
        .status(400)
        .json({ message: "No active users to send notifications to" });
    }

    // Create individual notifications for each user
    const notificationData = users.map((user) => ({
      userId: user._id,
      type,
      title,
      body,
      link,
      data,
      senderId: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      status: isSubadmin ? "pending" : "approved",
      requestedAt: isSubadmin ? Date.now() : undefined,
      reviewedAt: isSubadmin ? undefined : Date.now(),
      reviewedBy: isSubadmin ? undefined : req.user._id,
      isGlobal: true,
    }));

    const notifications = await Notification.insertMany(notificationData);

    if (!isSubadmin) {
      await sendPushToUsers(users.map((user) => user._id), { title, body, link, data });
    }

    res.status(isSubadmin ? 202 : 201).json({
      message: `Notification sent to ${notifications.length} users`,
      notificationCount: notifications.length,
      notifications: notifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to broadcast notification" });
  }
});

router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: "approved" },
      { read: req.body.read !== undefined ? req.body.read : true },
      { new: true },
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update notification" });
  }
});

router.put("/mark-all-read", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false, status: "approved" },
      { read: true },
    );

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to mark notifications read" });
  }
});

router.get("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: "approved",
    }).lean();

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch notification" });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
      status: "approved",
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to dismiss notification" });
  }
});

module.exports = router;
