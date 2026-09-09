const mongoose = require("mongoose");

// A singleton document used when a customer selects a destination without an
// active country-specific policy. Keeping this in the database makes the
// checkout and Merchant feed configurable without deployment environment vars.
const shippingSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true, immutable: true },
    defaultShippingPrice: { type: Number, default: 0, min: 0 },
    defaultDeliveryEstimate: {
      type: String,
      default: "3-7 business days",
      trim: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("ShippingSettings", shippingSettingsSchema);
