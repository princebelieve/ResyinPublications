const express = require("express");
const upload = require("../middleware/testimonialUpload");
const {
  getTestimonials,
  getTestimonialById,
  getAdminTestimonials,
  createContentUploadUrl,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
} = require("../controllers/testimonial.controller");
const { protect, adminOnly, adminOrSubadminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", getTestimonials);
router.get("/admin", protect, adminOrSubadminOnly, getAdminTestimonials);
router.get("/:id", getTestimonialById);
router.post("/admin/upload-url", protect, adminOrSubadminOnly, createContentUploadUrl);
router.post(
  "/admin",
  protect,
  adminOrSubadminOnly,
  upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }, { name: "audio", maxCount: 1 }, { name: "videoFile", maxCount: 1 }, { name: "audioFile", maxCount: 1 }]),
  createTestimonial,
);
router.put(
  "/admin/:id",
  protect,
  adminOrSubadminOnly,
  upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }, { name: "audio", maxCount: 1 }, { name: "videoFile", maxCount: 1 }, { name: "audioFile", maxCount: 1 }]),
  updateTestimonial,
);
router.delete("/admin/:id", protect, adminOnly, deleteTestimonial);

module.exports = router;
