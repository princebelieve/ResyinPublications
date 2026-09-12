// server/src/routes/product.routes.js
const express = require("express");

const router = express.Router();

const upload = require("../middleware/upload");

const {
  getProducts,
  getProduct,
  getProductCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");

const {
  protect,
  adminOnly,
  adminOrSubadminOnly,
} = require("../middleware/auth");

const Product = require("../models/Product");
const Order = require("../models/Order");
const { createPrivateBookDownloadUrl } = require("../config/r2");

// PUBLIC
router.get("/", getProducts);

router.get("/categories", getProductCategories);

router.get("/:id/download/:format", protect, async (req, res) => {
  try {
    const format = String(req.params.format || "").toLowerCase();
    if (!['pdf', 'epub'].includes(format)) {
      return res.status(400).json({ message: "Choose PDF or EPUB." });
    }

    const product = await Product.findOne({
      _id: req.params.id,
      hidden: { $ne: true },
      status: { $ne: "inactive" },
      approved: { $ne: false },
    }).select("name digitalFiles").lean();
    if (!product) return res.status(404).json({ message: "Book not found." });

    const order = await Order.findOne({
      userId: String(req.user.id),
      $or: [
        {
          paymentStatus: "paid",
          items: {
            $elemMatch: {
              productId: String(product._id),
              publisherId: "",
              $or: [{ format }, { editionKey: format }],
            },
          },
        },
        {
          items: {
            $elemMatch: {
              productId: String(product._id),
              publisherId: { $ne: "" },
              publisherPaymentStatus: "confirmed",
              $or: [{ format }, { editionKey: format }],
            },
          },
        },
      ],
    }).select("_id").sort({ paidAt: -1, createdAt: -1 }).lean();
    if (!order) {
      return res.status(403).json({ message: "Complete payment for this book before downloading it." });
    }

    const digitalFile = product.digitalFiles?.[format];
    if (!digitalFile?.key) return res.status(404).json({ message: `A ${format.toUpperCase()} file is not available for this book.` });

    const downloadUrl = await createPrivateBookDownloadUrl(digitalFile.key, digitalFile.fileName || `${product.name}.${format}`);
    return res.json({ downloadUrl, expiresIn: 600, format, book: product.name });
  } catch (error) {
    console.error("Digital book download error:", error);
    return res.status(500).json({ message: "Unable to prepare the download." });
  }
});

// DYNAMIC SITEMAP FOR SEO - must come before /:id route
router.get("/sitemap/xml", async (req, res) => {
  try {
    const products = await Product.find({ active: true }).select(
      "_id updatedAt",
    );

    const baseUrl =
      process.env.CLIENT_URL || process.env.BASE_URL || "http://localhost:5173";
    const staticPages = [
      { loc: baseUrl, priority: "1.00" },
      { loc: `${baseUrl}/collection`, priority: "0.90" },
      { loc: `${baseUrl}/contact`, priority: "0.80" },
      { loc: `${baseUrl}/about`, priority: "0.70" },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach((page) => {
      xml += "  <url>\n";
      xml += `    <loc>${page.loc}</loc>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += "  </url>\n";
    });

    // Add product pages
    products.forEach((product) => {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/product/${product._id}</loc>\n`;
      xml += `    <lastmod>${product.updatedAt.toISOString()}</lastmod>\n`;
      xml += "    <priority>0.75</priority>\n";
      xml += "  </url>\n";
    });

    xml += "</urlset>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
});

router.get("/:id", getProduct);

// ADMIN
router.post(
  "/",
  protect,
  adminOrSubadminOnly,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 20 },
    { name: "pieceImages", maxCount: 50 },
    { name: "pdfFile", maxCount: 1 },
    { name: "epubFile", maxCount: 1 },
  ]),
  createProduct,
);

router.put(
  "/:id",
  protect,
  adminOnly,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "gallery", maxCount: 20 },
    { name: "pieceImages", maxCount: 50 },
    { name: "pdfFile", maxCount: 1 },
    { name: "epubFile", maxCount: 1 },
  ]),
  updateProduct,
);

router.delete("/:id", protect, adminOrSubadminOnly, deleteProduct);

module.exports = router;
