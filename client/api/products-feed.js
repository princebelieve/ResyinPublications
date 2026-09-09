export default async function handler(req, res) {
  const backendUrl =
    process.env.VITE_API_URL || process.env.BASE_URL || "http://localhost:4000";
  const clientUrl =
    process.env.CLIENT_URL ||
    "https://resyinpublications.com";
  const publicClientUrl = clientUrl.split(",")[0].trim().replace(/\/$/, "");
    const apiUrl = `${backendUrl}/api/products`;
    const shippingUrl = `${backendUrl}/api/shipping/merchant-rates`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.status}`);
    }

    const products = await response.json();
    const shippingResponse = await fetch(shippingUrl);
    if (!shippingResponse.ok) {
      throw new Error(`Failed to fetch shipping rates: ${shippingResponse.status}`);
    }
    const shippingRates = await shippingResponse.json();

    // Create CSV feed for Google Merchant Center
    const csvHeaders = [
      "id",
      "title",
      "description",
      "link",
      "image_link",
      "price",
      "sale_price",
      "availability",
      "brand",
      "gtin",
      "condition",
      "google_product_category",
      "identifier_exists",
      ...shippingRates.map(
        () => "shipping(country:region:service:price:min_handling_time:max_handling_time:min_transit_time:max_transit_time)",
      ),
    ];

    let csv = csvHeaders.join(",") + "\n";

    products.forEach((product) => {
      const escapeCsvField = (field) => {
        if (!field) return '""';
        const stringField = String(field);
        if (
          stringField.includes(",") ||
          stringField.includes('"') ||
          stringField.includes("\n")
        ) {
          return `"${stringField.replace(/"/g, '""')}"`;
        }
        return stringField;
      };

      const row = [
        product._id || product.sku,
        product.name,
        product.fullDescription || product.shortDescription || product.name,
        `${publicClientUrl}/product/${product._id}`,
        product.coverImage,
        `${Number(product.price || 0).toFixed(2)} NGN`,
        product.salePrice != null && Number(product.salePrice) < Number(product.price) ? `${Number(product.salePrice).toFixed(2)} NGN` : "",
        product.inStock && product.stock > 0 ? "in_stock" : "out_of_stock",
        product.brand || "",
        product.gtin || "",
        product.condition || "new",
        product.googleProductCategory || "",
        product.gtin ? "yes" : "no",
        ...shippingRates.map((rate) =>
          `${rate.country}:${rate.region || ""}:${rate.service || "Standard delivery"}:${Number(rate.price || 0).toFixed(2)} NGN:${rate.minHandlingTime}:${rate.maxHandlingTime}:${rate.minTransitTime}:${rate.maxTransitTime}`,
        ),
      ]
        .map(escapeCsvField)
        .join(",");

      csv += row + "\n";
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="products-feed.csv"',
    );
    res.status(200).send(csv);
  } catch (error) {
    console.error("Product feed generation error:", error);
    res.status(500).json({
      error: "Failed to generate product feed",
      message: error.message,
    });
  }
}
