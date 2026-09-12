//client/src/pages/ProductDetails.jsx
import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";

import { useCart } from "../context/CartContext";

import { getDigitalBookDownloadUrl, getProductById, getShippingSummary } from "../services/api";

import { setMetaTags, setProductSchema, getShareUrl } from "../utils/metaTags";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState("");
  const [downloadMessage, setDownloadMessage] = useState("");
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [selectedEdition, setSelectedEdition] = useState("paperback");
  const { addToCart, cart } = useCart();
  const isDigitalSelected = ["pdf", "epub"].includes(selectedEdition);

  useEffect(() => {
    async function loadProduct() {
      try {
        setLoading(true);

        const data = await getProductById(id);

        setProduct(data);
        if (data?.editions?.length) setSelectedEdition(data.editions[0].format);

        if (data) {
          const productUrl =
            window.location.origin +
            `/product/${id}`;

          // Set meta tags for social sharing and SEO
          setMetaTags({
            title: `${data.name} | RESYIN PUBLICATIONS`,
            description:
              data.fullDescription ||
              data.shortDescription ||
              `Order ${data.name} from the RESYIN PUBLICATIONS catalog.`,
            image: data.coverImage,
            url: productUrl,
            type: "product",
          });

          // Set JSON-LD schema for Google
          setProductSchema(data, productUrl);
        }
      } catch (err) {
        console.error(err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  useEffect(() => {
    getShippingSummary("NG")
      .then(setDeliveryInfo)
      .catch(() => setDeliveryInfo(null));
  }, []);

  const lightboxItems = [
    ...(product?.coverImage ? [{
      image: product.coverImage,
      title: product.name,
      description: product.fullDescription || product.shortDescription || "",
    }] : []),
    ...(product?.gallery || []).map((img, index) => ({
      image: img,
      title: product?.name || `Image ${index + 1}`,
      description: product?.description || "",
    })),

    ...(product?.pieces || []).map((piece) => ({
      image: piece.image,
      title: piece.name,
      description: piece.description || "",
    })),
  ].filter((item) => item.image);

  if (loading) {
    return (
      <>
        <Navbar />

        <div className="page">
          <div className="product-detail">
            <div className="skeleton-image" />

            <div className="product-detail-content">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-price" />
              <div className="skeleton-button" />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />

        <div className="page">
          <h2>Product not found</h2>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div
        className="page product-page"
        style={{ "--product-image": `url("${product.coverImage}")` }}
      >
        <div className="product-detail">
          <img
            src={product.coverImage}
            alt={product.name}
            className="product-detail-image"
            role="button"
            tabIndex={0}
            onClick={() => setLightboxIndex(0)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setLightboxIndex(0);
              }
            }}
          />

          <div className="product-detail-content">
            <h1>{product.name}</h1>

            {(() => {
              const edition = product.editions?.find((item) => item.format === selectedEdition);
              const basePrice = edition ? edition.price : product.price;
              const salePrice = edition ? edition.salePrice : product.salePrice;
              return salePrice != null && Number(salePrice) < Number(basePrice) ? (
              <div>
                <h2>₦{Number(salePrice).toLocaleString()}</h2>
                <p className="muted"><s>₦{Number(basePrice).toLocaleString()}</s></p>
              </div>
            ) : (
              <h2>₦{Number(basePrice || 0).toLocaleString()}</h2>
            );
            })()}

            {(product.editions?.length > 0) && <label className="edition-selector">Edition
              <select value={selectedEdition} onChange={(event) => setSelectedEdition(event.target.value)}>
                {product.editions.map((edition) => <option key={edition.format} value={edition.format}>{edition.label || edition.format} — ₦{Number(edition.salePrice != null && edition.salePrice < edition.price ? edition.salePrice : edition.price).toLocaleString()}</option>)}
              </select>
            </label>}

            {product.shortDescription && <p className="muted">{product.shortDescription}</p>}
            <p>
              <strong>
                {isDigitalSelected
                  ? "Digital download available"
                  : Number(product.editions?.find((item) => item.format === selectedEdition)?.stock ?? product.stock ?? 0) > 0
                    ? "In stock"
                    : "Currently unavailable"}
              </strong>
            </p>

            {(product.digitalFiles?.pdf?.key || product.digitalFiles?.epub?.key) && (
              <div className="digital-book-downloads">
                <strong>Digital editions</strong>
                <p className="muted">Downloads become available after your payment is confirmed.</p>
                <div>
                  {product.digitalFiles?.pdf?.key && <button type="button" onClick={async () => { try { setDownloadMessage(""); const result = await getDigitalBookDownloadUrl(product._id, "pdf"); window.location.href = result.downloadUrl; } catch (error) { setDownloadMessage(error.message || "Sign in and complete payment to download this book."); } }}>Download PDF</button>}
                  {product.digitalFiles?.epub?.key && <button type="button" onClick={async () => { try { setDownloadMessage(""); const result = await getDigitalBookDownloadUrl(product._id, "epub"); window.location.href = result.downloadUrl; } catch (error) { setDownloadMessage(error.message || "Sign in and complete payment to download this book."); } }}>Download EPUB</button>}
                </div>
                {downloadMessage && <p className="inline-toast error">{downloadMessage}</p>}
              </div>
            )}

            {(product.fullDescription || product.shortDescription) && (
              <div className="product-description">
                <p>
                  {expandedDescription
                    ? product.fullDescription || product.shortDescription
                    : (
                        product.fullDescription || product.shortDescription
                      ).substring(0, 150)}
                  {!expandedDescription &&
                    (product.fullDescription || product.shortDescription)
                      .length > 150 &&
                    "..."}
                </p>
                {(product.fullDescription || product.shortDescription).length >
                  150 && (
                  <button
                    type="button"
                    className="view-more-btn"
                    onClick={() => setExpandedDescription(!expandedDescription)}
                  >
                    {expandedDescription ? "Show Less" : "View More"}
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={addLoading}
              onClick={async () => {
                setAddError("");
                setAddSuccess(false);
                setAddLoading(true);

                const result = await addToCart(product, 1, selectedEdition);

                setAddLoading(false);

                if (result.success) {
                  setAddSuccess(true);
                  setTimeout(() => setAddSuccess(false), 2000);
                } else {
                  setAddError(result.message || "Failed to add item to cart.");
                }
              }}
            >
              {addLoading
                ? "Adding..."
                : addSuccess
                  ? "Added ✔"
                  : isDigitalSelected
                    ? "Add Digital Copy"
                    : "Add To Cart"}
            </button>

            <button
              type="button"
              className="primary"
              disabled={addLoading}
              onClick={async () => {
                setAddError("");
                setAddSuccess(false);
                setAddLoading(true);

                const alreadyInCart = cart.some(
                  (item) => item.productId === product._id && item.editionKey === selectedEdition,
                );

                if (alreadyInCart) {
                  setAddLoading(false);
                  navigate("/checkout");
                  return;
                }

                const result = await addToCart(product, 1, selectedEdition);
                setAddLoading(false);

                if (result.success) navigate("/checkout");
                else setAddError(result.message || "Failed to add item to cart.");
              }}
            >
              {addLoading ? "Adding..." : isDigitalSelected ? `Buy ${selectedEdition.toUpperCase()}` : "Buy Now"}
            </button>

            {(addSuccess || addError) && (
              <div
                className={`inline-toast ${addSuccess ? "success" : "error"}`}
              >
                {addSuccess ? "Added to cart" : addError}
              </div>
            )}

            <div className="product-share-section">
              <p
                style={{
                  marginTop: "1.5rem",
                  fontSize: "0.9rem",
                  color: "#666",
                }}
              >
                Share:
              </p>
              <div
                className="share-buttons"
                style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}
              >
                <button
                  type="button"
                  className="share-btn share-facebook"
                  title="Share on Facebook"
                  onClick={() => {
                    const shareUrl = getShareUrl(product._id, product.name);
                    window.open(
                      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
                      "_blank",
                      "width=600,height=400",
                    );
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#1877f2",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Facebook
                </button>

                <button
                  type="button"
                  className="share-btn share-twitter"
                  title="Share on Twitter"
                  onClick={() => {
                    const shareUrl = getShareUrl(product._id, product.name);
                    window.open(
                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=Explore ${encodeURIComponent(product.name)} from RESYIN PUBLICATIONS`,
                      "_blank",
                      "width=600,height=400",
                    );
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#1da1f2",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Twitter
                </button>

                <button
                  type="button"
                  className="share-btn share-whatsapp"
                  title="Share on WhatsApp"
                  onClick={() => {
                    const shareUrl = getShareUrl(product._id, product.name);
                    window.open(
                      `https://wa.me/?text=${encodeURIComponent(`Check out this product: ${product.name} - ${shareUrl}`)}`,
                      "_blank",
                    );
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#25d366",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  WhatsApp
                </button>

                <button
                  type="button"
                  className="share-btn share-copy"
                  title="Copy link"
                  onClick={() => {
                    const shareUrl = getShareUrl(product._id, product.name);
                    navigator.clipboard.writeText(shareUrl);
                    alert("Link copied to clipboard!");
                  }}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    border: "1px solid #ddd",
                    backgroundColor: "#f5f5f5",
                    color: "#333",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>

        {(deliveryInfo?.estimatedDays || deliveryInfo?.serviceName || product.category || product.brand || product.vendor || product.countryOfOrigin || product.condition || product.sku || product.gtin) && (
          <section className="product-information-grid" aria-label="Book information">
            {(deliveryInfo?.estimatedDays || deliveryInfo?.serviceName) && (
              <div className="cart-summary product-information-card">
                <h3>Delivery</h3>
                {deliveryInfo.serviceName && <p><strong>Method:</strong> {deliveryInfo.serviceName}</p>}
                {deliveryInfo.estimatedDays && <p><strong>Estimated delivery to Nigeria:</strong> {deliveryInfo.estimatedDays}</p>}
                <p className="muted">Your delivery fee and estimate are confirmed for your destination at checkout.</p>
              </div>
            )}

            {(product.category || product.brand || product.vendor || product.countryOfOrigin || product.condition || product.sku || product.gtin) && (
              <div className="cart-summary product-information-card">
                <h3>Book details</h3>
                {product.category && <p><strong>Category:</strong> {product.category}</p>}
                {product.brand && <p><strong>Author:</strong> {product.brand}</p>}
                {product.vendor && <p><strong>Publisher:</strong> {product.vendor}</p>}
                {product.countryOfOrigin && <p><strong>Country of origin:</strong> {product.countryOfOrigin}</p>}
                {product.condition && <p><strong>Condition:</strong> {product.condition}</p>}
                {(product.sku || product.gtin) && <p><strong>Catalog code / ISBN:</strong> {product.sku || product.gtin}</p>}
              </div>
            )}
          </section>
        )}

        {product.gallery?.length > 0 && (
          <div className="gallery-strip">
            {product.gallery.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`${product.name}-${index}`}
                className="gallery-thumb"
                role="button"
                tabIndex={0}
                onClick={() => setLightboxIndex(index + 1)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setLightboxIndex(index + 1);
                  }
                }}
              />
            ))}
          </div>
        )}

        {product.pieces?.length > 0 && (
          <div className="pieces-section">
            <h2>Included Pieces</h2>

            <div className="pieces-grid">
              {product.pieces.map((piece, index) => (
                <div key={index} className="piece-display-card">
                  {piece.image && (
                    <img
                      src={piece.image}
                      alt={piece.name}
                      className="piece-image"
                      role="button"
                      tabIndex={0}
                      onClick={() => setLightboxIndex((product.gallery?.length || 0) + index + 1)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setLightboxIndex((product.gallery?.length || 0) + index + 1);
                        }
                      }}
                    />
                  )}

                  <div className="piece-content">
                    <h3>{piece.name}</h3>

                    {piece.dimensions && <p>{piece.dimensions}</p>}

                    {piece.description && <span>{piece.description}</span>}

                    <strong>
                      ₦{Number(piece.price || 0).toLocaleString()}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lightboxIndex !== null && (
          <div className="lightbox">
            <button
              className="lightbox-close"
              onClick={() => setLightboxIndex(null)}
            >
              ✕
            </button>

            {lightboxIndex > 0 && (
              <button
                className="lightbox-arrow left"
                onClick={() => setLightboxIndex((prev) => prev - 1)}
              >
                ‹
              </button>
            )}

            {lightboxIndex < lightboxItems.length - 1 && (
              <button
                className="lightbox-arrow right"
                onClick={() => setLightboxIndex((prev) => prev + 1)}
              >
                ›
              </button>
            )}

            <div
              className="lightbox-slider"
              style={{
                transform: `translateX(-${lightboxIndex * 100}%)`,
              }}
            >
              {lightboxItems.map((item, index) => (
                <div className="lightbox-slide" key={index}>
                  <img src={item.image} alt={item.title} />

                  <div className="lightbox-overlay">
                    <h3>{item.title}</h3>

                    {item.description && <p>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
