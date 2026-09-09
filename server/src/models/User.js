//server/src/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: ["user", "admin", "subadmin"],
      default: "user",
    },

    distributorStatus: {
      type: String,
      enum: ["none", "pending", "approved", "suspended"],
      default: "none",
    },

    distributorCode: { type: String, default: undefined, unique: true, sparse: true },
    distributorBankName: { type: String, default: "" },
    distributorBankCode: { type: String, default: "" },
    distributorAccountName: { type: String, default: "" },
    distributorAccountNumber: { type: String, default: "" },
    distributorPickupAddress: { type: String, default: "" },
    distributorPickupEnabled: { type: Boolean, default: true },
    distributorDeliveryEnabled: { type: Boolean, default: true },
    distributorBusinessName: { type: String, default: "" },
    distributorApplicationNote: { type: String, default: "" },
    distributorDeliveryCoverage: { type: String, default: "" },

    phone: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Number,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Number,
    },
    pendingEmail: {
      type: String,
      lowercase: true,
      default: "",
    },
    pendingEmailVerificationToken: {
      type: String,
    },
    pendingEmailVerificationExpires: {
      type: Number,
    },
    // Admin controls
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspendedAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    deletionRequestedAt: {
      type: Date,
    },
    deletionRequestReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
