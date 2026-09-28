const origin = "https://resyinpublications.com";
const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

export default async function handler(req, res) {
  const id = req.query?.id;
  if (typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id)) return res.status(400).send("Invalid book link.");
  const backend = process.env.VITE_API_URL?.replace(/\/+$/, "");
  res.setHeader("Cache-Control", "no-store");
  if (!backend) return res.status(503).send("Book preview is temporarily unavailable.");
  try {
    const response = await fetch(`${backend}/api/products/${encodeURIComponent(id)}`, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) return res.status(response.status === 404 ? 404 : 503).send("Book preview is unavailable.");
    const book = await response.json();
    if (!book.name || !book.coverImage) return res.status(503).send("Book preview is incomplete.");
    const pageUrl = `${origin}/product/${id}`;
    const shareUrl = `${origin}/share/product?id=${id}`;
    const title = escapeHtml(`${book.name} | RESYIN Publications`);
    const description = escapeHtml(book.shortDescription || book.fullDescription || book.name);
    const coverUrl = new URL(book.coverImage, `${backend}/`);
    if (!["http:", "https:"].includes(coverUrl.protocol)) throw new Error("Invalid cover URL");
    const cover = escapeHtml(coverUrl.href);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="canonical" href="${pageUrl}"><meta name="description" content="${description}"><meta property="og:type" content="book"><meta property="og:site_name" content="RESYIN Publications"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:image" content="${cover}"><meta property="og:image:alt" content="${title}"><meta property="og:url" content="${shareUrl}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${cover}"></head><body><h1>${title}</h1><img src="${cover}" alt="${title}"><p>${description}</p><a href="${pageUrl}">View book details</a><script>window.location.replace(${JSON.stringify(pageUrl)})</script></body></html>`);
  } catch {
    return res.status(503).send("Book preview is temporarily unavailable. Please try again.");
  }
}
