//server/src/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");

const connectDB = require("./config/db");

const paystackWebhookRoutes = require("./routes/paystack.webhook.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const authRoutes = require("./routes/auth.routes");
const measurementRoutes = require("./routes/measurementRoutes");
const cartRoutes = require("./routes/cart.routes");
const checkoutRoutes = require("./routes/checkout.routes");
const userRoutes = require("./routes/user.routes");
const adminOrderRoutes = require("./routes/admin.order.routes");
const adminUserRoutes = require("./routes/admin.user.routes");
const adminProductRoutes = require("./routes/admin.product.routes");
const adminNotificationRoutes = require("./routes/admin.notification.routes");
const shippingRoutes = require("./routes/shipping.routes");
const inquiryRoutes = require("./routes/inquiries.routes");
const adminShippingRoutes = require("./routes/adminShipping.routes");
const notificationRoutes = require("./routes/notification.routes");
const pushRoutes = require("./routes/push.routes");
const testimonialRoutes = require("./routes/testimonial.routes");
const shareRoutes = require("./routes/share.routes");
const distributorRoutes = require("./routes/distributor.routes");
const adminDistributorRoutes = require("./routes/admin.distributor.routes");
const paymentSettingsRoutes = require("./routes/payment.settings.routes");
const publisherSubscriptionSettingsRoutes = require("./routes/publisher.subscription.settings.routes");
const transportCompanyRoutes = require("./routes/transportCompany.routes");
const { runUserRetentionCleanup } = require("./routes/admin.user.routes");

const Product = require("./models/Product");
const NigerianStateShipping = require("./models/NigerianStateShipping");
const ShippingSettings = require("./models/ShippingSettings");

const app = express();

connectDB();

runUserRetentionCleanup().catch((error) => {
  console.error("Initial retention cleanup failed:", error);
});

setInterval(() => {
  runUserRetentionCleanup().catch((error) => {
    console.error("Scheduled retention cleanup failed:", error);
  });
}, 6 * 60 * 60 * 1000);

// Paystack requires the raw request body for signature verification
app.use(
  "/api/paystack/webhook",
  express.raw({ type: "application/json" }),
  paystackWebhookRoutes,
);

// middleware
app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173")
      .split(",")
      .map((url) => url.trim()),
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/testimonials", testimonialRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/distributor", distributorRoutes);
app.use("/api/admin/distributors", adminDistributorRoutes);
app.use("/api/payment-settings", paymentSettingsRoutes);
app.use("/api/publisher-subscription-settings", publisherSubscriptionSettingsRoutes);
app.use("/api/transport-companies", transportCompanyRoutes);

// DYNAMIC SITEMAP - serves at root level for Google
app.get("/sitemap.xml", async (req, res) => {
  try {
    const products = await Product.find({ active: true }).select(
      "_id updatedAt",
    );

    const host = req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = (
      process.env.CLIENT_URL ||
      process.env.BASE_URL ||
      (host ? `${protocol}://${host}` : "http://localhost:5173")
    )
      .split(",")[0]
      .trim()
      .replace(/\/$/, "");

    const staticPages = [
      { loc: baseUrl, priority: "1.00" },
      { loc: `${baseUrl}/collection`, priority: "0.90" },
      { loc: `${baseUrl}/contact`, priority: "0.80" },
      { loc: `${baseUrl}/support`, priority: "0.80" },
      { loc: `${baseUrl}/testimonials`, priority: "0.80" },
      { loc: `${baseUrl}/about`, priority: "0.70" },
      { loc: `${baseUrl}/privacy-policy`, priority: "0.50" },
      { loc: `${baseUrl}/refund-policy`, priority: "0.50" },
      { loc: `${baseUrl}/terms-conditions`, priority: "0.50" },
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

// GOOGLE SHOPPING FEED - for Google Merchant Center
app.get("/feed.xml", async (req, res) => {
  try {
    const products = await Product.find({
      hidden: { $ne: true },
      pendingApproval: { $ne: true },
      pendingDeletion: { $ne: true },
      status: { $ne: "inactive" },
      approved: { $ne: false },
    });

    const baseUrl = (process.env.CLIENT_URL || process.env.BASE_URL || "http://localhost:5173")
      .split(",")[0]
      .trim()
      .replace(/\/$/, "");

    const [zones, settings] = await Promise.all([
      NigerianStateShipping.find({ active: true }).select(
        "state baseDeliveryFee serviceName",
      ),
      ShippingSettings.findOneAndUpdate(
        { key: "default" },
        { $setOnInsert: { key: "default" } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      ),
    ]);
    // Product and checkout prices are NGN, so only NGN delivery rates can be
    // advertised in this feed. Merchant requires the shipping price currency
    // to match the offer price currency.
    const shippingRates = zones.map((zone) => ({
        country: "NG",
        region: zone.state,
        price: Number(zone.baseDeliveryFee || 0),
        service: zone.serviceName || "Standard delivery",
        minHandlingTime: 0,
        maxHandlingTime: 1,
        minTransitTime: 0,
        maxTransitTime: 1,
      }));

    if (!shippingRates.length) {
      shippingRates.push({
        country: "NG",
        price: Number(settings.defaultShippingPrice || 0),
        service: "Standard delivery",
        minHandlingTime: 0,
        maxHandlingTime: 1,
        minTransitTime: 0,
        maxTransitTime: 1,
      });
    }

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml +=
      '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">\n';
    xml += `  <title>RESYIN Publications Products</title>\n`;
    xml += `  <link rel="alternate" type="text/html" href="${baseUrl}"/>\n`;
    xml += `  <updated>${new Date().toISOString()}</updated>\n`;
    xml += `  <author><name>RESYIN Publications</name></author>\n`;

    products.forEach((product) => {
      // Availability: use Google canonical values
      const availability =
        product.inStock === false || Number(product.stock || 0) <= 0
          ? "out_of_stock"
          : "in_stock";

      const itemId = product.sku || product._id;
      const description =
        product.fullDescription || product.shortDescription || product.name;

      xml += "  <entry>\n";
      xml += `    <id>${escapeXml(String(itemId))}</id>\n`;
      xml += `    <g:id>${escapeXml(String(itemId))}</g:id>\n`;
      xml += `    <title>${escapeXml(product.name)}</title>\n`;
      xml += `    <description>${escapeXml(description)}</description>\n`;
      xml += `    <link rel="alternate" type="text/html" href="${baseUrl}/product/${product._id}"/>\n`;
      xml += `    <g:image_link>${product.coverImage}</g:image_link>\n`;
      const regularPrice = Number(product.price || 0);
      const salePrice = Number(product.salePrice);
      const hasSalePrice = Number.isFinite(salePrice) && salePrice >= 0 && salePrice < regularPrice;
      xml += `    <g:price>${regularPrice.toFixed(2)} NGN</g:price>\n`;
      if (hasSalePrice) xml += `    <g:sale_price>${salePrice.toFixed(2)} NGN</g:sale_price>\n`;
      xml += `    <g:availability>${availability}</g:availability>\n`;
      if (product.brand) xml += `    <g:brand>${escapeXml(product.brand)}</g:brand>\n`;
      if (product.gtin) xml += `    <g:gtin>${escapeXml(product.gtin)}</g:gtin>\n`;
      if (!product.gtin) xml += "    <g:identifier_exists>no</g:identifier_exists>\n";
      xml += `    <g:condition>${escapeXml(product.condition || "new")}</g:condition>\n`;
      xml += `    <g:product_type>${escapeXml(product.category || "Books")}</g:product_type>\n`;
      if (product.googleProductCategory) xml += `    <g:google_product_category>${escapeXml(product.googleProductCategory)}</g:google_product_category>\n`;
      shippingRates.forEach((rate) => {
        xml += `    <g:shipping>\n`;
        xml += `      <g:country>${escapeXml(rate.country)}</g:country>\n`;
        xml += `      <g:region>${escapeXml(rate.region || "")}</g:region>\n`;
        xml += `      <g:service>${escapeXml(rate.service)}</g:service>\n`;
        xml += `      <g:price>${rate.price.toFixed(2)} NGN</g:price>\n`;
        xml += `      <g:min_handling_time>${rate.minHandlingTime}</g:min_handling_time>\n`;
        xml += `      <g:max_handling_time>${rate.maxHandlingTime}</g:max_handling_time>\n`;
        xml += `      <g:min_transit_time>${rate.minTransitTime}</g:min_transit_time>\n`;
        xml += `      <g:max_transit_time>${rate.maxTransitTime}</g:max_transit_time>\n`;
        xml += `    </g:shipping>\n`;
      });
      xml += "  </entry>\n";
    });

    xml += "</feed>";

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (error) {
    console.error("Feed generation error:", error);
    res.status(500).json({ error: "Failed to generate feed" });
  }
});

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// routes
app.use("/api/auth", authRoutes); // ✅ ADD THIS
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/measurements", measurementRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/admin/shipping", adminShippingRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/notifications", adminNotificationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/push", pushRoutes);
app.use("/api/admin/users", adminUserRoutes);

app.get("/", (req, res) => {
  res.send("RESYIN Publications API is running");
});

// Keep multipart validation errors in JSON so the Content Studio can show a
// useful message instead of receiving Express's default HTML error page.
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "The selected media file is larger than the allowed upload limit." });
    }
    return res.status(400).json({ message: `Media upload failed: ${error.message}` });
  }

  if (error?.message === "Only audio, image, or video files are allowed.") {
    return res.status(415).json({ message: error.message });
  }

  return next(error);
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
