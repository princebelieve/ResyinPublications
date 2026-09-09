const mongoose = require("mongoose");

const storePaymentSettingsSchema = new mongoose.Schema({
  key: { type: String, default: "default", unique: true, immutable: true },
  manualTransferEnabled: { type: Boolean, default: false },
  bankName: { type: String, default: "", trim: true },
  bankCode: { type: String, default: "", trim: true },
  accountName: { type: String, default: "", trim: true },
  accountNumber: { type: String, default: "", trim: true },
  transferInstructions: { type: String, default: "", trim: true, maxlength: 1000 },
}, { timestamps: true });

module.exports = mongoose.model("StorePaymentSettings", storePaymentSettingsSchema);
