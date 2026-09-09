//server/src/routes/measurementRoutes.js
const express = require("express");
const Measurement = require("../models/Measurement");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// CREATE measurement
router.post("/", async (req, res) => {
  try {
    const measurement = await Measurement.create(req.body);
    res.status(201).json(measurement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all (ADMIN USE)
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const data = await Measurement.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE (optional admin)
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Measurement.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
