//server/src/routes/shipping.routes.js
const express = require("express");

const router = express.Router();

const { calculateShipping } = require("../config/shipping");
const ShippingZone = require("../models/ShippingZone");
const NigerianStateShipping = require("../models/NigerianStateShipping");
const ShippingSettings = require("../models/ShippingSettings");

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

router.get("/nigerian-states", async (req, res) => {
  res.json(NIGERIAN_STATES.map((state) => ({ state })));
});

router.get("/destinations", async (req, res) => {
  try {
    const zones = await ShippingZone.find({ active: true, currency: "NGN" })
      .select("state")
      .sort({ state: 1 });
    const destinations = zones.map((zone) => zone.state).filter(Boolean);
    res.json(destinations.length ? destinations : ["NG"]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load shipping destinations" });
  }
});

router.get("/summary", async (req, res) => {
  try {
    const shippingData = await calculateShipping({
      country: req.query.country || "NG",
      state: req.query.state || "",
      items: [],
    });
    if (shippingData.shippingAvailable === false) {
      return res.status(400).json(shippingData);
    }
    res.json(shippingData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to load delivery information" });
  }
});

// Used by the hosted CSV feed. Prices are NGN because checkout and product
// prices are NGN; Merchant requires a shipping price in the offer currency.
router.get("/merchant-rates", async (req, res) => {
  try {
    const [stateRates, settings] = await Promise.all([
      NigerianStateShipping.find({ active: true }).select(
        "state baseDeliveryFee serviceName estimatedDays",
      ),
      ShippingSettings.findOneAndUpdate(
        { key: "default" },
        { $setOnInsert: { key: "default" } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ),
    ]);
    const rates = stateRates.map((rate) => ({
        country: "NG",
        region: rate.state,
        price: Number(rate.baseDeliveryFee || 0),
        service: rate.serviceName || "Standard delivery",
        minHandlingTime: 0,
        maxHandlingTime: 1,
        minTransitTime: 0,
        maxTransitTime: 1,
      }));

    res.json(rates.length ? rates : [{
      country: "NG",
      price: Number(settings.defaultShippingPrice || 0),
      service: "Standard delivery",
      minHandlingTime: 0,
      maxHandlingTime: 1,
      minTransitTime: 0,
      maxTransitTime: 1,
    }]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Unable to fetch Merchant shipping rates" });
  }
});

router.post("/preview", async (req, res) => {
  try {
    const { country, state, items } = req.body;

    const shippingData = await calculateShipping({
      country,
      state,
      items,
    });

    if (shippingData.shippingAvailable === false) {
      return res.status(400).json(shippingData);
    }

    res.json(shippingData);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to calculate shipping",
    });
  }
});

module.exports = router;
