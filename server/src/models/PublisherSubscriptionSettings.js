const mongoose = require("mongoose");

const publisherSubscriptionSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "default", unique: true, immutable: true },
  enabled: { type: Boolean, default: false },
  annualFee: { type: Number, default: 0, min: 0 },
  currency: { type: String, default: "NGN", uppercase: true, trim: true },
  subscriptionDays: { type: Number, default: 365, min: 1 },
  gracePeriodDays: { type: Number, default: 14, min: 0 },
  autoRenewEnabled: { type: Boolean, default: false },
  requireAdminApproval: { type: Boolean, default: true },
  authorTerms: { type: String, default: "", trim: true, maxlength: 5000 },
}, { timestamps: true });

module.exports = mongoose.model("PublisherSubscriptionSettings", publisherSubscriptionSettingsSchema);
