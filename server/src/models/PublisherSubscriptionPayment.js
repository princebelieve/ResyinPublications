const mongoose = require("mongoose");

const publisherSubscriptionPaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reference: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  currency: { type: String, default: "NGN" },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  paidAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("PublisherSubscriptionPayment", publisherSubscriptionPaymentSchema);
