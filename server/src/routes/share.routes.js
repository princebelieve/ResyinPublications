const express = require("express");
const Testimonial = require("../models/Testimonial");

const router = express.Router();

function escapeHtml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function clientBaseUrl() {
  const configured = (process.env.CLIENT_URL || "http://localhost:5173").split(",")[0].trim().replace(/\/$/, "");
  try {
    const parsed = new URL(configured);
    // A Render health-check URL is an API endpoint, never a customer-facing
    // destination for a shared post. Fall back to the public web app instead.
    if (/^\/health\/?$/i.test(parsed.pathname)) return "https://resyinpublications.com";
  } catch {
    return "https://resyinpublications.com";
  }
  return configured;
}

function youtubeThumbnail(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);
    const id = host.endsWith("youtu.be") ? parts[0] : parsed.searchParams.get("v") || (["shorts", "embed", "live"].includes(parts[0]) ? parts[1] : "");
    return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : "";
  } catch {
    return "";
  }
}

function sharePage(res, { title, description, image, canonicalUrl, redirectUrl }) {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image || `${clientBaseUrl()}/resyin-mark.svg`);
  const safeCanonical = escapeHtml(canonicalUrl);
  const safeRedirect = escapeHtml(redirectUrl);
  res.type("html").send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${safeTitle}</title><meta name="description" content="${safeDescription}"><link rel="canonical" href="${safeCanonical}"><meta property="og:type" content="website"><meta property="og:site_name" content="RESYIN Publications"><meta property="og:title" content="${safeTitle}"><meta property="og:description" content="${safeDescription}"><meta property="og:image" content="${safeImage}"><meta property="og:image:alt" content="${safeTitle}"><meta property="og:url" content="${safeCanonical}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${safeTitle}"><meta name="twitter:description" content="${safeDescription}"><meta name="twitter:image" content="${safeImage}"><meta http-equiv="refresh" content="0; url=${safeRedirect}"><script>window.location.replace(${JSON.stringify(redirectUrl)});</script></head><body><p>Opening <a href="${safeRedirect}">${safeTitle}</a>…</p></body></html>`);
}

// Keep previously shared Render URLs working without a database lookup or
// JavaScript redirect. The storefront handles book availability and errors.
router.get("/product/:id", (req, res) => {
  const productUrl = new URL(
    `/share/product?id=${encodeURIComponent(req.params.id)}`,
    "https://resyinpublications.com",
  );
  const originalUrl = new URL(req.originalUrl, "https://resyinpublications.com");
  for (const [key, value] of originalUrl.searchParams) {
    if (key.startsWith("utm_")) productUrl.searchParams.append(key, value);
  }
  res.redirect(301, productUrl.toString());
});

router.get("/content/:id", async (req, res) => {
  try {
    const post = await Testimonial.findOne({ _id: req.params.id, approved: { $ne: false }, status: "active" }).lean();
    if (!post) return res.status(404).send("Content not found.");
    const postUrl = `${clientBaseUrl()}/testimonials#${post._id}`;
    sharePage(res, { title: post.title || post.name || "RESYIN update", description: post.seoDescription || post.testimony || "Read the latest RESYIN Publications update.", image: post.image || youtubeThumbnail(post.videoUrl), canonicalUrl: postUrl, redirectUrl: postUrl });
  } catch (error) {
    res.status(500).send("Unable to prepare content preview.");
  }
});

module.exports = router;
