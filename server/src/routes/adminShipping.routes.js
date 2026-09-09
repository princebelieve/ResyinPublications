//server/src/routes/adminShipping.routes.js
const express = require("express");

const router = express.Router();

const ShippingZone = require("../models/ShippingZone");
const ShippingSettings = require("../models/ShippingSettings");
const NigerianStateShipping = require("../models/NigerianStateShipping");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/settings", protect, adminOnly, async (req, res) => {
  try {
    const settings = await ShippingSettings.findOneAndUpdate(
      { key: "default" },
      { $setOnInsert: { key: "default" } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to fetch default shipping settings" });
  }
});

router.put("/settings", protect, adminOnly, async (req, res) => {
  try {
    const defaultShippingPrice = Number(req.body.defaultShippingPrice);
    const defaultDeliveryEstimate = String(req.body.defaultDeliveryEstimate || "").trim();

    if (!Number.isFinite(defaultShippingPrice) || defaultShippingPrice < 0) {
      return res.status(400).json({ message: "Default shipping price must be zero or greater." });
    }
    if (!defaultDeliveryEstimate) {
      return res.status(400).json({ message: "A default delivery estimate is required." });
    }

    const settings = await ShippingSettings.findOneAndUpdate(
      { key: "default" },
      { $set: { defaultShippingPrice, defaultDeliveryEstimate } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to save default shipping settings" });
  }
});

router.get("/states", protect, adminOnly, async (req, res) => {
  try { res.json(await NigerianStateShipping.find().sort({ state: 1 })); }
  catch { res.status(500).json({ message: "Unable to fetch state delivery rates." }); }
});

router.post("/states", protect, adminOnly, async (req, res) => {
  try {
    const state = String(req.body.state || "").trim().toUpperCase();
    const baseDeliveryFee = Number(req.body.baseDeliveryFee);
    if (!state || !Number.isFinite(baseDeliveryFee) || baseDeliveryFee < 0) return res.status(400).json({ message: "A state and a valid delivery fee are required." });
    res.status(201).json(await NigerianStateShipping.create({ state, baseDeliveryFee, serviceName: req.body.serviceName || "State delivery", estimatedDays: req.body.estimatedDays || "2-5 business days", active: req.body.active !== false }));
  } catch (error) { res.status(400).json({ message: error.code === 11000 ? "A delivery rate already exists for this state." : "Unable to save state delivery rate." }); }
});

router.put("/states/:id", protect, adminOnly, async (req, res) => {
  try {
    const baseDeliveryFee = Number(req.body.baseDeliveryFee);
    if (!Number.isFinite(baseDeliveryFee) || baseDeliveryFee < 0) return res.status(400).json({ message: "Enter a valid delivery fee." });
    const rate = await NigerianStateShipping.findByIdAndUpdate(req.params.id, { $set: { state: String(req.body.state || "").trim().toUpperCase(), baseDeliveryFee, serviceName: req.body.serviceName || "State delivery", estimatedDays: req.body.estimatedDays || "2-5 business days", active: req.body.active !== false } }, { new: true, runValidators: true });
    if (!rate) return res.status(404).json({ message: "State delivery rate not found." });
    res.json(rate);
  } catch { res.status(400).json({ message: "Unable to update state delivery rate." }); }
});

router.delete("/states/:id", protect, adminOnly, async (req, res) => {
  try { await NigerianStateShipping.findByIdAndDelete(req.params.id); res.json({ message: "State delivery rate deleted." }); }
  catch { res.status(500).json({ message: "Unable to delete state delivery rate." }); }
});

// GET ALL ZONES
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const zones = await ShippingZone.find().sort({
      createdAt: -1,
    });

    res.json(zones);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to fetch shipping zones",
    });
  }
});

// CREATE ZONE
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    if (String(req.body.state || "").trim().toUpperCase() === "NG") {
      return res.status(400).json({ message: "Nigeria uses state delivery prices. Add or edit a Nigerian state rate instead." });
    }
    const zone = await ShippingZone.create(req.body);

    res.status(201).json(zone);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to create shipping zone",
    });
  }
});

// UPDATE ZONE
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    if (String(req.body.state || "").trim().toUpperCase() === "NG") {
      return res.status(400).json({ message: "Nigeria uses state delivery prices. Add or edit a Nigerian state rate instead." });
    }
    const updated = await ShippingZone.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      },
    );

    res.json(updated);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to update shipping zone",
    });
  }
});

// DELETE ZONE
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await ShippingZone.findByIdAndDelete(req.params.id);

    res.json({
      message: "Shipping zone deleted",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to delete shipping zone",
    });
  }
});

module.exports = router;
