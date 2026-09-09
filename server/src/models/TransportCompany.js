const mongoose = require("mongoose");

const transportCompanySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  states: [{ type: String, trim: true, uppercase: true }],
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("TransportCompany", transportCompanySchema);
