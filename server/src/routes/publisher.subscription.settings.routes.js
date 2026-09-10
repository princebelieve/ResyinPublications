const express = require("express");
const PublisherSubscriptionSettings = require("../models/PublisherSubscriptionSettings");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

async function getSettings() {
  return PublisherSubscriptionSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
}

router.get("/public", async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      enabled: Boolean(settings.enabled && settings.annualFee > 0),
      annualFee: settings.enabled ? settings.annualFee : 0,
      currency: settings.currency,
      subscriptionDays: settings.subscriptionDays,
      gracePeriodDays: settings.gracePeriodDays,
      requireAdminApproval: settings.requireAdminApproval,
      authorTerms: settings.enabled ? settings.authorTerms : "",
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load publisher subscription settings." });
  }
});

router.get("/admin", protect, adminOnly, async (req, res) => {
  try {
    res.json(await getSettings());
  } catch (error) {
    res.status(500).json({ message: "Unable to load publisher subscription settings." });
  }
});

router.put("/admin", protect, adminOnly, async (req, res) => {
  try {
    const annualFee = Number(req.body.annualFee || 0);
    const subscriptionDays = Number(req.body.subscriptionDays || 365);
    const gracePeriodDays = Number(req.body.gracePeriodDays || 0);
    if (!Number.isFinite(annualFee) || annualFee < 0) return res.status(400).json({ message: "Enter a valid annual fee." });
    if (!Number.isInteger(subscriptionDays) || subscriptionDays < 1) return res.status(400).json({ message: "Subscription duration must be at least one day." });
    if (!Number.isInteger(gracePeriodDays) || gracePeriodDays < 0) return res.status(400).json({ message: "Grace period cannot be negative." });

    const settings = {
      enabled: req.body.enabled === true,
      annualFee,
      currency: String(req.body.currency || "NGN").trim().toUpperCase(),
      subscriptionDays,
      gracePeriodDays,
      autoRenewEnabled: req.body.autoRenewEnabled === true,
      requireAdminApproval: req.body.requireAdminApproval !== false,
      authorTerms: String(req.body.authorTerms || "").trim(),
    };
    if (settings.enabled && annualFee <= 0) return res.status(400).json({ message: "Set an annual fee before enabling publisher subscriptions." });
    res.json(await PublisherSubscriptionSettings.findOneAndUpdate(
      { key: "default" },
      { $set: settings, $setOnInsert: { key: "default" } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ));
  } catch (error) {
    res.status(400).json({ message: "Unable to save publisher subscription settings." });
  }
});

module.exports = router;
