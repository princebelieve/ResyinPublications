export default async function handler(req, res) {
  const backendUrl = process.env.VITE_API_URL || process.env.BASE_URL;
  const apiUrl = backendUrl ? `${backendUrl.replace(/\/$/, "")}/api/products` : null;

  try {
    let products = [];
    if (apiUrl) {
      const response = await fetch(apiUrl);
      if (response.ok) products = await response.json();
    }

    const baseUrl = "https://resyinpublications.com";
    const staticPages = [
      { loc: baseUrl, priority: "1.00" },
      { loc: `${baseUrl}/collection`, priority: "0.95" },
      { loc: `${baseUrl}/support`, priority: "0.90" },
      { loc: `${baseUrl}/testimonials`, priority: "0.85" },
      { loc: `${baseUrl}/outreach`, priority: "0.80" },
      { loc: `${baseUrl}/journey`, priority: "0.80" },
      { loc: `${baseUrl}/contact`, priority: "0.85" },
      { loc: `${baseUrl}/about`, priority: "0.75" },
      { loc: `${baseUrl}/privacy-policy`, priority: "0.70" },
      { loc: `${baseUrl}/refund-policy`, priority: "0.70" },
      { loc: `${baseUrl}/terms-conditions`, priority: "0.70" },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    staticPages.forEach((page) => {
      xml += "  <url>\n";
      xml += `    <loc>${page.loc}</loc>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += "  </url>\n";
    });

    products.forEach((product) => {
      const lastmod = product.updatedAt
        ? new Date(product.updatedAt).toISOString()
        : null;

      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/product/${product._id}</loc>\n`;
      if (lastmod) {
        xml += `    <lastmod>${lastmod}</lastmod>\n`;
      }
      xml += "    <priority>0.75</priority>\n";
      xml += "  </url>\n";
    });

    xml += "</urlset>";

    res.setHeader("Content-Type", "application/xml");
    res.status(200).send(xml);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).send("Failed to generate sitemap");
  }
}
