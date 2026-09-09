//server/src/models/Inquiry.js
const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },

    projectType: { type: String, required: true },

    roomType: { type: String },

    budget: { type: String },

    timeline: { type: String },

    message: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Inquiry", inquirySchema);
