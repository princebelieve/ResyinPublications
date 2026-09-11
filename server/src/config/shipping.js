//server/src/config/shipping.js
const ShippingZone = require("../models/ShippingZone");
const ShippingSettings = require("../models/ShippingSettings");
const NigerianStateShipping = require("../models/NigerianStateShipping");

// `state` remains the persisted field name for backward-compatible data migration.
// It now contains an ISO destination country code (for example NG or GB).
// Nigerian state rates take priority, followed by the country and global fallback rates.
async function calculateShipping({ country = "", state = "", items = [] }) {
  const destination = country.toUpperCase().trim();
  const stateName = state.toUpperCase().trim();

  const defaultSettings = await ShippingSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const defaultShippingFee = Number(defaultSettings?.defaultShippingPrice || 0);
  const defaultEstimate = defaultSettings?.defaultDeliveryEstimate || "3-7 business days";

  if (destination === "NG") {
    if (!stateName) {
      return {
        shippingFee: defaultShippingFee,
        flatRate: defaultShippingFee,
        estimatedDays: defaultEstimate,
        serviceName: "Standard delivery",
        currency: "NGN",
        dutiesAndTaxes: "customer",
        shippingAvailable: true,
        rateScope: "default",
        message: "A Nigerian state was not selected; showing the default delivery estimate.",
      };
    }

    const stateRate = await NigerianStateShipping.findOne({ state: stateName, active: true });
    if (stateRate) {
      const shippingFee = Number(stateRate.baseDeliveryFee || 0);
      return { shippingFee, flatRate: shippingFee, estimatedDays: stateRate.estimatedDays, serviceName: stateRate.serviceName, currency: "NGN", dutiesAndTaxes: "customer", shippingAvailable: true, rateScope: "state" };
    }

    return {
      shippingAvailable: false,
      message: "Delivery is not yet configured for this state. Please contact RESYIN for assistance.",
    };
  }
  const zone = await ShippingZone.findOne({ state: destination, active: true });

  if (!zone) {
    const settings = await ShippingSettings.findOneAndUpdate(
      { key: "default" },
      { $setOnInsert: { key: "default" } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    const shippingFee = Number(settings.defaultShippingPrice || 0);
    return {
      shippingFee,
      flatRate: shippingFee,
      estimatedDays: settings.defaultDeliveryEstimate,
      serviceName: "Standard delivery",
      currency: "NGN",
      dutiesAndTaxes: "customer",
      shippingAvailable: true,
    };
  }

  const shippingFee = Number(zone.baseDeliveryFee || 0);
  return {
    shippingFee,
    flatRate: shippingFee,
    estimatedDays: zone.estimatedDays,
    serviceName: zone.serviceName,
    currency: zone.currency,
    dutiesAndTaxes: zone.dutiesAndTaxes,
    shippingAvailable: true,
  };
}

module.exports = { calculateShipping };
