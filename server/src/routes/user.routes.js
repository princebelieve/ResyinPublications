//server/src/routes/user.routes.js
const express = require("express");
const crypto = require("crypto");

const router = express.Router();

const { protect } = require("../middleware/auth");
const { sendEmailVerification } = require("../services/email");
const { notifyAdmins } = require("../services/notification.service");

const Order = require("../models/Order");

const User = require("../models/User");
const upload = require("../middleware/upload");
const { uploadAvatar } = require("../controllers/user.controller");

router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  res.json(user);
});

router.get("/orders", protect, async (req, res) => {
  const orders = await Order.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  res.json(orders);
});

router.post("/avatar", protect, upload.single("avatar"), uploadAvatar);

router.get("/profile", protect, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  const orders = await Order.find({ userId: req.user.id }).sort({
    createdAt: -1,
  });

  res.json({
    user,
    orders,
  });
});

router.put("/profile", protect, async (req, res) => {
  try {
    const { name, phone, address, city, state, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let responseMessage = "Profile updated";

    if (email && email.toLowerCase() !== user.email) {
      const normalizedEmail = String(email || "").toLowerCase();
      const emailTaken = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });

      if (emailTaken) {
        return res.status(400).json({
          message: "That email is already in use by another account.",
        });
      }

      const pendingEmailVerificationToken = crypto
        .randomBytes(32)
        .toString("hex");
      const pendingEmailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;

      user.pendingEmail = normalizedEmail;
      user.pendingEmailVerificationToken = pendingEmailVerificationToken;
      user.pendingEmailVerificationExpires = pendingEmailVerificationExpires;
      responseMessage =
        "Your new email address requires confirmation. Check your new inbox.";

      const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173")
        .split(",")[0]
        .trim();
      const verificationUrl = `${clientUrl}/verify-email?token=${pendingEmailVerificationToken}`;

      try {
        await sendEmailVerification({
          to: normalizedEmail,
          verificationUrl,
        });
      } catch (emailError) {
        console.warn(
          "Email verification send failed for profile update:",
          emailError.message,
        );
      }
    }

    user.name = name;
    user.phone = phone;
    user.address = address;
    user.city = city;
    user.state = state;
    await user.save();

    const updatedUser = await User.findById(req.user.id).select("-password");

    res.json({
      message: responseMessage,
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Profile update failed",
    });
  }
});

router.post("/delete-request", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role !== "user") {
      return res.status(403).json({ message: "Account deletion requests must be handled by an administrator." });
    }
    if (user.isDeleted) {
      return res.status(400).json({ message: "This account is already marked for deletion." });
    }
    if (user.deletionRequestedAt) {
      return res.status(409).json({ message: "Your account deletion request is already awaiting review." });
    }

    user.deletionRequestedAt = new Date();
    user.deletionRequestReason = String(req.body.reason || "").trim().slice(0, 1000);
    await user.save();

    const admins = await User.find({ role: "admin" }).select("_id");
    await notifyAdmins(
      {
        type: "account.deletion.requested",
        title: "Account deletion requested",
        body: `${user.name || user.email} requested account deletion.`,
        link: "/admin/users",
        data: { userId: user._id },
      },
      admins.map((admin) => admin._id),
    );

    res.status(202).json({ message: "Your account deletion request has been sent for review." });
  } catch (error) {
    console.error("Account deletion request failed:", error);
    res.status(500).json({ message: "Unable to submit account deletion request" });
  }
});

module.exports = router;
