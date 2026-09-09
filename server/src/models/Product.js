//server/src/models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // COLLECTION NAME
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // URL FRIENDLY NAME
    slug: {
      type: String,
      default: "",
      trim: true,
    },

    // CATEGORY
    category: {
      type: String,
      default: "",
      trim: true,
    },

    // SMALL TEXT FOR CARDS
    shortDescription: {
      type: String,
      default: "",
      trim: true,
    },

    // FULL DETAIL PAGE DESCRIPTION
    fullDescription: {
      type: String,
      default: "",
      trim: true,
    },

    // MAIN COVER IMAGE
    coverImage: {
      type: String,
      required: true,
    },

    // GALLERY IMAGES
    gallery: {
      type: [String],
      default: [],
    },

    // COLLECTION PRICE
    price: {
      type: Number,
      default: 0,
    },
    salePrice: { type: Number, default: null },
    distributorPrice: { type: Number, default: null, min: 0 },
    distributorMinimumQuantity: { type: Number, default: 1, min: 1 },
    currency: { type: String, default: "NGN", trim: true, uppercase: true },

    stock: {
      type: Number,
      default: 0,
    },

    soldCount: {
      type: Number,
      default: 0,
    },

    inStock: {
      type: Boolean,
      default: true,
    },

    featured: {
      type: Boolean,
      default: false,
    },

    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    brand: { type: String, default: "" },
    vendor: { type: String, default: "" },
    gtin: { type: String, default: "", trim: true },
    nafdacNumber: { type: String, default: "", trim: true },
    googleProductCategory: { type: String, default: "", trim: true },
    condition: { type: String, enum: ["new", "refurbished", "used"], default: "new" },
    ingredients: { type: String, default: "" },
    directions: { type: String, default: "" },
    warnings: { type: String, default: "" },
    netContent: { type: String, default: "" },
    countryOfOrigin: { type: String, default: "" },
    shippingWeight: { type: Number, default: 0 },
    shippingLength: { type: Number, default: 0 },
    shippingWidth: { type: Number, default: 0 },
    shippingHeight: { type: Number, default: 0 },
    shippingClass: { type: String, default: "standard", trim: true },
    shipsInternationally: { type: Boolean, default: true },

    inventoryTracking: {
      type: Boolean,
      default: true,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    approved: {
      type: Boolean,
      default: true,
    },
    pendingApproval: {
      type: Boolean,
      default: false,
    },
    pendingDeletion: {
      type: Boolean,
      default: false,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletionRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    deletionRequestedAt: {
      type: Date,
    },

    mainCategory: { type: String, default: "" },
    subCategory: { type: String, default: "" },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Product", productSchema);
