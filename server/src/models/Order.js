//server/src/models/Order.js
const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      default: "",
    },

    name: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      default: 0,
    },

    quantity: {
      type: Number,
      default: 1,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: "",
    },

    customerName: {
      type: String,
      default: "",
    },

    email: {
      type: String,
      default: "",
    },

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

    notes: {
      type: String,
      default: "",
    },

    items: {
      type: [orderItemSchema],
      default: [],
    },

    subtotal: {
      type: Number,
      default: 0,
    },

    shippingFee: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    currency: {
      type: String,
      default: "NGN",
    },

    distributorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    distributorCode: { type: String, default: "" },

    paymentMethod: {
      type: String,
      enum: ["paystack", "cash_on_delivery", "distributor_transfer", "manual_bank_transfer"],
      default: "paystack",
    },

    cashCollectionStatus: {
      type: String,
      enum: ["not_applicable", "pending_collection", "payment_confirmed", "failed"],
      default: "not_applicable",
    },

    manualTransferStatus: {
      type: String,
      enum: ["not_applicable", "pending_verification", "verified", "rejected"],
      default: "not_applicable",
    },

    paymentReference: {
      type: String,
      unique: true,
      sparse: true,
    },

    confirmationTokenHash: { type: String, select: false },
    confirmationTokenExpires: { type: Date, select: false },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "partially_refunded"],
      default: "pending",
    },

    deliveryStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "ready_for_dispatch",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
    },

    orderNumber: {
      type: String,
      unique: true,
      default: () => "ORD-" + Date.now(),
    },

    deliveryMethod: {
      type: String,
      default: "home",
    },

    installationNeeded: {
      type: String,
      default: "no",
    },

    deliveryFee: {
      type: Number,
      default: 0,
    },

    deliveryZone: {
      type: String,
      default: "",
    },

    pickupLocation: { type: String, default: "" },
    transportCompanyPickupPoint: { type: String, default: "" },
    paymentInstructions: { type: String, default: "" },

    deliveryEstimate: {
      type: String,
      default: "",
    },

    shippingService: {
      type: String,
      default: "",
    },

    deliveryContact: {
      type: String,
      default: "",
    },

    estimatedDeliveryDate: {
      type: String,
      default: "",
    },

    trackingNotes: {
      type: String,
      default: "",
    },

    adminNotes: {
      type: String,
      default: "",
    },

    assignedStaff: {
      type: String,
      default: "",
    },

    archived: {
      type: Boolean,
      default: false,
    },

    refundStatus: {
      type: String,
      default: "none",
    },

    refundReason: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
    },

    deliveredAt: {
      type: Date,
    },

    cancelledAt: {
      type: Date,
    },

    statusHistory: [
      {
        status: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", orderSchema);
