const express = require("express");

const router = express.Router();

const { protect, adminOnly } = require("../middleware/auth");

const User = require("../models/User");
const Cart = require("../models/Cart");
const RefreshToken = require("../models/RefreshToken");
const { createNotification } = require("../services/notification.service");
const { sendPushToUser } = require("../services/push.service");

const RETENTION_DAYS = 90;

async function permanentDeleteUser(userId) {
  const user = await User.findById(userId);
  if (!user) return { deleted: false, reason: "User not found" };

  await Promise.all([
    Cart.deleteMany({ userId: user._id }),
    RefreshToken.deleteMany({ user: user._id }),
  ]);

  await User.findByIdAndDelete(user._id);

  return { deleted: true, userId: user._id };
}

async function runUserRetentionCleanup() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

  const usersToDelete = await User.find({
    $or: [
      { isDeleted: true, deletedAt: { $lt: cutoff } },
      { isSuspended: true, suspendedAt: { $lt: cutoff } },
    ],
  }).select("_id");

  for (const user of usersToDelete) {
    try {
      await permanentDeleteUser(user._id);
    } catch (error) {
      console.error("Failed to permanently delete a user:", error);
    }
  }

  return usersToDelete.length;
}

router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("name email phone role distributorStatus distributorCode distributorBusinessName distributorApplicationNote distributorDeliveryCoverage distributorBankName distributorAccountName distributorAccountNumber distributorPickupAddress isSuspended isDeleted deletionRequestedAt deletionRequestReason createdAt")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Unable to fetch users" });
  }
});

// PUT /api/admin/users/:id - update suspend / soft-delete flags and role
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { isSuspended, isDeleted, role, distributorStatus, permanentDelete, deleteImmediately } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const wasDistributorApproved = user.distributorStatus === "approved";

    if (permanentDelete || deleteImmediately) {
      const result = await permanentDeleteUser(user._id);
      if (!result.deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.json({
        message: "User permanently deleted",
        deletedUserId: result.userId,
      });
    }

    if (typeof isSuspended !== "undefined") {
      user.isSuspended = !!isSuspended;
      user.suspendedAt = isSuspended ? user.suspendedAt || new Date() : null;
    }

    if (typeof isDeleted !== "undefined") {
      user.isDeleted = !!isDeleted;
      user.deletedAt = isDeleted ? user.deletedAt || new Date() : null;
      user.deletionRequestedAt = undefined;
      user.deletionRequestReason = "";
    }

    if (role) {
      const validRoles = ["user", "admin", "subadmin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      user.role = role;
    }

    if (distributorStatus) {
      const validStatuses = ["none", "pending", "approved", "suspended"];
      if (!validStatuses.includes(distributorStatus)) return res.status(400).json({ message: "Invalid distributor status" });
      user.distributorStatus = distributorStatus;
      if (distributorStatus === "approved" && !user.distributorCode) user.distributorCode = `ELD-${String(user._id).slice(-6).toUpperCase()}`;
    }

    await user.save();

    if (user.distributorStatus === "approved" && !wasDistributorApproved) {
      const notification = await createNotification({
        userId: user._id,
        type: "distributor.application.approved",
        title: "Distributor Application Approved",
        body: "Your distributor application has been approved. Your distributor dashboard is now available.",
        link: "/distributor",
        data: { distributorCode: user.distributorCode },
      });
      if (notification) {
        await sendPushToUser(user._id, {
          title: notification.title,
          body: notification.body,
          link: notification.link,
          data: notification.data,
        });
      }
    }

    res.json({
      message: "User updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        distributorStatus: user.distributorStatus,
        distributorCode: user.distributorCode,
        isSuspended: user.isSuspended,
        isDeleted: user.isDeleted,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Unable to update user" });
  }
});

module.exports = router;
module.exports.runUserRetentionCleanup = runUserRetentionCleanup;
