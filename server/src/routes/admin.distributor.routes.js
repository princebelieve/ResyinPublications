const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/auth");
const DistributorInventory = require("../models/DistributorInventory");
const DistributorStockOrder = require("../models/DistributorStockOrder");

router.get("/inventory", protect, adminOnly, async (req, res) => {
  const [inventory, orders] = await Promise.all([
    DistributorInventory.find().populate("distributorId", "name email distributorCode").populate("productId", "name sku").sort({ updatedAt: -1 }).lean(),
    DistributorStockOrder.find().populate("distributorId", "name email distributorCode").sort({ createdAt: -1 }).limit(100).lean(),
  ]);
  res.json({ inventory: inventory.filter((item) => item.distributorId && item.productId), orders: orders.filter((item) => item.distributorId) });
});

module.exports = router;
