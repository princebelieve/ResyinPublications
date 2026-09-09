const mongoose = require("mongoose");

const nigerianStateShippingSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true, trim: true, uppercase: true },
  baseDeliveryFee: { type: Number, required: true, min: 0 },
  serviceName: { type: String, default: "State delivery", trim: true },
  estimatedDays: { type: String, default: "2-5 business days", trim: true },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("NigerianStateShipping", nigerianStateShippingSchema);
