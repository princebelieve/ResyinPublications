const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  name: String,
  quantity: Number,
  unitPrice: Number,
}, { _id: false });

const distributorStockOrderSchema = new mongoose.Schema({
  distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  items: { type: [itemSchema], default: [] },
  totalAmount: { type: Number, default: 0 },
  paymentReference: { type: String, unique: true, sparse: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  fulfilledAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("DistributorStockOrder", distributorStockOrderSchema);
