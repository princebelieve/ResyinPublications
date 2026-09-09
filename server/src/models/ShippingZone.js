//server/src/models/ShippingZone.js
const mongoose = require("mongoose");

const categoryPricingSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const shippingZoneSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    cities: {
      type: [String],
      default: [],
    },

    distanceLabel: {
      type: String,
      default: "",
    },

    baseDeliveryFee: {
      type: Number,
      default: 0,
    },

    categoryPricing: {
      type: [categoryPricingSchema],
      default: [],
    },

    estimatedDays: {
      type: String,
      default: "3-7 days",
    },

    orderCutoffTime: {
      type: String,
      default: "",
    },

    handlingTimeMinDays: {
      type: Number,
      default: 0,
    },

    handlingTimeMaxDays: {
      type: Number,
      default: 0,
    },

    transitTimeMinDays: {
      type: Number,
      default: 0,
    },

    transitTimeMaxDays: {
      type: Number,
      default: 1,
    },

    fulfillmentDays: {
      type: String,
      default: "Mon – Sat",
    },

    pickupEnabled: {
      type: Boolean,
      default: true,
    },

    serviceName: { type: String, default: "Standard Shipping" },
    currency: { type: String, default: "NGN", uppercase: true },
    dutiesAndTaxes: {
      type: String,
      enum: ["customer", "included"],
      default: "customer",
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ShippingZone", shippingZoneSchema);
