//server/src/controllers/user.controller.js
const User = require("../models/User");
const { uploadToR2 } = require("../config/r2");
const { createNotification } = require("../services/notification.service");
const { sendPushToUser } = require("../services/push.service");

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "No image uploaded",
      });
    }

    const avatarUrl = await uploadToR2(req.file, "avatars");

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        avatar: avatarUrl,
      },
      {
        new: true,
      },
    ).select("-password");

    const notification = await createNotification({
      userId: req.user.id,
      type: "profile.avatar.updated",
      title: "Profile image updated",
      body: "Your profile image was uploaded successfully.",
      link: "/profile",
    });
    if (notification) {
      await sendPushToUser(req.user.id, {
        title: notification.title,
        body: notification.body,
        link: notification.link,
        data: notification.data,
      });
    }

    res.json({
      message: "Avatar uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Avatar upload failed",
    });
  }
};

module.exports = {
  uploadAvatar,
};
