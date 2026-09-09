//server/src/models/Measurement.js
import mongoose from "mongoose";

const measurementSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },

    outfitType: { type: String }, // senator, suit, gown, native etc

    chest: String,
    waist: String,
    shoulder: String,
    sleeve: String,
    neck: String,
    length: String,

    hip: String,
    thigh: String,
    trouserLength: String,

    notes: String,
  },
  { timestamps: true },
);

export default mongoose.model("Measurement", measurementSchema);
