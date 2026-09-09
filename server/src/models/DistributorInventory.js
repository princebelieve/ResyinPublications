const mongoose = require("mongoose");

const distributorInventorySchema = new mongoose.Schema({
  distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  quantity: { type: Number, default: 0, min: 0 },
  unitsSold: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

distributorInventorySchema.index({ distributorId: 1, productId: 1 }, { unique: true });
module.exports = mongoose.model("DistributorInventory", distributorInventorySchema);
