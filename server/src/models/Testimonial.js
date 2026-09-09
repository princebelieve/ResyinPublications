const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    contentType: { type: String, enum: ["testimony", "announcement", "story", "outreach", "journey", "homepage-media"], default: "testimony" },
    mediaType: { type: String, enum: ["text", "image", "video", "audio"], default: "text" },
    title: { type: String, default: "", trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "", trim: true },
    testimony: { type: String, required: true, trim: true },
    linkUrl: { type: String, default: "", trim: true },
    image: { type: String, default: "" },
    videoUrl: { type: String, default: "", trim: true },
    videoFile: { type: String, default: "" },
    audioFile: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    bannerEnabled: { type: Boolean, default: false },
    sitewideAdvertEnabled: { type: Boolean, default: false },
    approved: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    seoTitle: { type: String, default: "", trim: true },
    seoDescription: { type: String, default: "", trim: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    announcementNotifiedAt: { type: Date },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
