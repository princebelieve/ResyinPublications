const express = require("express");
const TransportCompany = require("../models/TransportCompany");
const NigerianStateShipping = require("../models/NigerianStateShipping");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();
const normalizeStates = (states) => [...new Set((Array.isArray(states) ? states : []).map((state) => String(state).trim().toUpperCase()).filter(Boolean))];
const starterCompanies = ["ABC Transport", "Agofure Motors", "Ameosa Motors", "Big Joe Motors", "Chisco Transport", "Cross Country Transport", "Delta Line", "Edo Line / Edo Choice", "Edegbe Line", "Ekeson Transport", "Efex Executive", "Ezenwata Transport", "Faith Motors", "God Is Good Motors (GIGM)", "God's Time Motors", "Goodness and Mercy Transport", "GUO Transport", "Ifesinachi Transport", "ITC (Imo State Transport Company)", "Ijele Transport Company", "Iyare Motors", "Peace Mass Transit", "The Young Shall Grow", "Unity Motors"];

router.get("/", async (req, res) => {
  try {
    const state = String(req.query.state || "").trim().toUpperCase();
    const filter = { active: true, ...(state ? { states: state } : {}) };
    res.json(await TransportCompany.find(filter).sort({ name: 1 }).lean());
  } catch { res.status(500).json({ message: "Unable to load transport companies." }); }
});

router.get("/admin", protect, adminOnly, async (req, res) => {
  try { res.json(await TransportCompany.find().sort({ name: 1 }).lean()); }
  catch { res.status(500).json({ message: "Unable to load transport companies." }); }
});

router.post("/admin", protect, adminOnly, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Transport company name is required." });
    res.status(201).json(await TransportCompany.create({ name, states: normalizeStates(req.body.states), active: req.body.active !== false }));
  } catch (error) { res.status(400).json({ message: error.code === 11000 ? "This transport company already exists." : "Unable to save transport company." }); }
});

router.post("/admin/import-starter", protect, adminOnly, async (req, res) => {
  try {
    const states = (await NigerianStateShipping.find({ active: true }).select("state").lean()).map((rate) => rate.state);
    if (!states.length) return res.status(400).json({ message: "Add at least one active state shipping rate before importing transport companies." });
    await TransportCompany.bulkWrite(starterCompanies.map((name) => ({ updateOne: { filter: { name }, update: { $setOnInsert: { name, states, active: true } }, upsert: true } })));
    res.json({ message: `${starterCompanies.length} starter transport companies imported for your active delivery states.` });
  } catch { res.status(500).json({ message: "Unable to import starter transport companies." }); }
});

router.put("/admin/:id", protect, adminOnly, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) return res.status(400).json({ message: "Transport company name is required." });
    const company = await TransportCompany.findByIdAndUpdate(req.params.id, { name, states: normalizeStates(req.body.states), active: req.body.active !== false }, { new: true, runValidators: true });
    if (!company) return res.status(404).json({ message: "Transport company not found." });
    res.json(company);
  } catch (error) { res.status(400).json({ message: error.code === 11000 ? "This transport company already exists." : "Unable to update transport company." }); }
});

router.delete("/admin/:id", protect, adminOnly, async (req, res) => {
  try { await TransportCompany.findByIdAndDelete(req.params.id); res.json({ message: "Transport company deleted." }); }
  catch { res.status(500).json({ message: "Unable to delete transport company." }); }
});

module.exports = router;
