// server/src/routes/inquiries.routes.js
const express = require("express");

const router = express.Router();

const Inquiry = require("../models/Inquiry");
const User = require("../models/User");
const { protect, adminOnly } = require("../middleware/auth");
const { notifyAdmins } = require("../services/notification.service");

// Create inquiry
router.post("/", async (req, res) => {
  try {
    const inquiry = new Inquiry(req.body);

    await inquiry.save();

    // Notify admins of new inquiry
    const admins = await User.find({ role: "admin" }).select("_id");
    const adminIds = admins.map((admin) => admin._id);

    if (adminIds.length > 0) {
      await notifyAdmins(
        {
          type: "inquiry.received",
          title: "New Inquiry Received",
          body: `New inquiry from ${inquiry.name}: ${inquiry.subject || "No subject"}`,
          link: `/admin/inquiries`,
          data: { inquiryId: inquiry._id },
        },
        adminIds,
      );
    }

    res.status(201).json({
      message: "Inquiry submitted successfully",
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);

    res.status(500).json({
      message: "Failed to submit inquiry",
    });
  }
});

// Get inquiries
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({
      createdAt: -1,
    });

    res.json(inquiries);
  } catch (error) {
    console.error("Error fetching inquiries:", error);

    res.status(500).json({
      message: "Failed to fetch inquiries",
    });
  }
});

module.exports = router;
