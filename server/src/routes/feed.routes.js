// server/src/routes/feed.routes.js - Google Shopping Feed for Merchant Center

const express = require("express");
const router = express.Router();
const Product = require("../models/Product");

// GOOGLE SHOPPING FEED (XML)
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find({
      hidden: { $ne: true },
      pendingApproval: { $ne: true },
      pendingDeletion: { $ne: true },
      status: { $ne: "inactive" },
      approved: { $ne: false },
    });

    const baseUrl =
      process.env.CLIENT_URL || process.env.BASE_URL || "http://localhost:5173";

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml +=
      '<feed xmlns="http://www.w3.org/2005/Atom" xmlns:g="http://base.google.com/ns/1.0">\n';
    xml += `  <title>RESYIN Publications Products</title>\n`;
    xml += `  <link rel="alternate" type="text/html" href="${baseUrl}"/>\n`;
    xml += `  <updated>${new Date().toISOString()}</updated>\n`;
    xml += `  <author><name>RESYIN Publications</name></author>\n`;

    products.forEach((product) => {
      xml += "  <entry>\n";
      xml += `    <id>${escapeXml(String(product.sku || product._id))}</id>\n`;
      xml += `    <title>${escapeXml(product.name)}</title>\n`;
      xml += `    <description>${escapeXml(product.fullDescription || product.shortDescription || product.name)}</description>\n`;
      xml += `    <link rel="alternate" type="text/html" href="${baseUrl}/product/${product._id}"/>\n`;
      xml += `    <g:image_link>${product.coverImage}</g:image_link>\n`;
      xml += `    <g:price>${product.price} NGN</g:price>\n`;
      xml += `    <g:availability>${product.inStock && product.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>\n`;
      xml += `    <g:brand>${product.brand || "RESYIN Publications"}</g:brand>\n`;
      xml += `    <g:condition>new</g:condition>\n`;
      xml += `    <g:product_type>${escapeXml(product.category || "Books")}</g:product_type>\n`;
      xml += `    <g:sku>${product.sku || product._id}</g:sku>\n`;
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

module.exports = router;
