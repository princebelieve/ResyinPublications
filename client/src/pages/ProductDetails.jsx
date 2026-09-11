//client/src/pages/ProductDetails.jsx
import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";

import { useCart } from "../context/CartContext";

import { getDigitalBookDownloadUrl, getProductById } from "../services/api";

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
  const [selectedEdition, setSelectedEdition] = useState("paperback");
  const { addToCart, cart } = useCart();

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

  const lightboxItems = [
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

  const currentEdition = product?.editions?.find((item) => item.format === selectedEdition) || null;
  const currentPrice = currentEdition ? Number(currentEdition.price || 0) : Number(product?.price || 0);
  const currentSalePrice = currentEdition ? (currentEdition.salePrice != null ? Number(currentEdition.salePrice) : null) : (product?.salePrice != null ? Number(product.salePrice) : null);
  const inStock = Number(currentEdition?.stock ?? product?.stock ?? 0) > 0;

  const editionCards = (product.editions?.length
    ? product.editions
    : [{ format: selectedEdition || "paperback", label: "Paperback", price: product.price || 0, salePrice: product.salePrice ?? null, stock: product.stock || 0 }]
  ).map((edition) => {
    const price = Number(edition.price || 0);
    const sale = edition.salePrice != null ? Number(edition.salePrice) : null;
    const finalPrice = sale != null && sale < price ? sale : price;

    return {
      ...edition,
      displayLabel: edition.label || edition.format || "Book",
      finalPrice,
    };
  });

  const [viewerIndex, setViewerIndex] = useState(0);
  const [formatIndex, setFormatIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);

  useEffect(() => {
    if (formatIndex > editionCards.length - 1) {
      setFormatIndex(0);
    }
  }, [editionCards.length, formatIndex]);

  const viewerSlides = [
    {
      key: "cover",
      content: (
        <div className="product-demo-card product-cover-card">
          <div className="product-hero-head">
            <span className="product-brand-mark">RESYIN PUBLICATIONS</span>
            <div className="product-hero-actions">
              <button type="button" className="mini-icon" aria-label="Like this book">♥</button>
              <button type="button" className="mini-icon" aria-label="Share this book" onClick={() => {
                const shareUrl = getShareUrl(product._id, product.name);
                navigator.clipboard?.writeText(shareUrl);
              }}>↗</button>
            </div>
          </div>

          <div className="product-hero-visual">
            <img src={product.coverImage} alt={product.name} className="product-cover-hero" />
          </div>

          <div className="product-hero-meta">
            <p className="eyebrow">{product.category || "Book"}</p>
            <h1>{product.name}</h1>
            {(product.author || product.brand) && <p className="author-line">by {product.author || product.brand}</p>}
          </div>

          <div className="product-hero-price-row">
            <strong>₦{(currentSalePrice != null && currentSalePrice < currentPrice ? currentSalePrice : currentPrice).toLocaleString()}</strong>
            {currentSalePrice != null && currentSalePrice < currentPrice && <span><s>₦{currentPrice.toLocaleString()}</s></span>}
          </div>
        </div>
      ),
    },
    {
      key: "summary",
      content: (
        <div className="product-demo-card product-info-card">
          <div className="card-header-row">
            <span className="eyebrow">Highlights</span>
            <span className="card-pill">Popular</span>
          </div>
          <h2>What readers will love</h2>
          <ul>
            <li>{product.shortDescription || "A powerful read with a strong story and clean presentation."}</li>
            <li>{product.fullDescription ? product.fullDescription.split(".").slice(0, 2).join(".") : "Available in a format that matches your reading preference."}</li>
            <li>{inStock ? "Ready to ship or download after payment." : "Currently being prepared for the next available order."}</li>
          </ul>
        </div>
      ),
    },
    {
      key: "details",
      content: (
        <div className="product-demo-card product-info-card">
          <div className="card-header-row">
            <span className="eyebrow">Book details</span>
            <span className="card-pill">Details</span>
          </div>
          <h2>Edition and delivery</h2>
          <div className="mini-details">
            {product.category && <p><strong>Category:</strong> {product.category}</p>}
            {product.vendor && <p><strong>Publisher:</strong> {product.vendor}</p>}
            {deliveryInfo?.serviceName && <p><strong>Delivery:</strong> {deliveryInfo.serviceName}</p>}
            {deliveryInfo?.estimatedDays && <p><strong>ETA:</strong> {deliveryInfo.estimatedDays}</p>}
            {(product.sku || product.gtin) && <p><strong>Catalog:</strong> {product.sku || product.gtin}</p>}
          </div>
        </div>
      ),
    },
  ];

  const goToEdition = (editionFormat) => {
    setSelectedEdition(editionFormat);
    if (editionCards.some((edition) => edition.format === editionFormat)) {
      const index = editionCards.findIndex((edition) => edition.format === editionFormat);
      setFormatIndex(index >= 0 ? index : 0);
    }
  };

  const swipeSlide = (direction) => {
    const nextIndex = direction === "left" ? Math.min(viewerIndex + 1, viewerSlides.length - 1) : Math.max(viewerIndex - 1, 0);
    setViewerIndex(nextIndex);
  };

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX == null) return;
    const endX = event.changedTouches[0].clientX;
    const distance = touchStartX - endX;

    if (Math.abs(distance) > 45) {
      if (distance > 0) swipeSlide("left");
      else swipeSlide("right");
    }

    setTouchStartX(null);
  };

  return (
    <>
      <Navbar />

      <div className="page product-page">
        <div className="product-immersive-shell">
          <div className="product-swipe-viewer" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="product-slide-track" style={{ transform: `translateX(-${viewerIndex * 100}%)` }}>
              {viewerSlides.map((slide) => (
                <div key={slide.key} className="product-slide-item">
                  {slide.content}
                </div>
              ))}
            </div>
          </div>

          <div className="product-slide-dots" aria-label="Book detail slides">
            {viewerSlides.map((slide, index) => (
              <button
                key={slide.key}
                type="button"
                className={`slide-dot ${index === viewerIndex ? "active" : ""}`}
                onClick={() => setViewerIndex(index)}
                aria-label={`Show slide ${index + 1}`}
              />
            ))}
          </div>

          <div className="product-format-rail" aria-label="Book formats and pricing">
            <div className="product-format-track" style={{ transform: `translateX(-${formatIndex * 100}%)` }}>
              {editionCards.map((edition) => (
                <button
                  key={edition.format || edition.displayLabel}
                  type="button"
                  className={`format-choice ${selectedEdition === edition.format ? "selected" : ""}`}
                  onClick={() => {
                    goToEdition(edition.format);
                    navigate("/checkout");
                  }}
                >
                  <div className="format-choice-top">
                    <span>{edition.displayLabel}</span>
                    <strong>₦{edition.finalPrice.toLocaleString()}</strong>
                  </div>

                  <div className="format-choice-bottom">
                    <span>{edition.stock > 0 ? "Ready to ship" : "Pre-order"}</span>
                    <small>{edition.salePrice != null && edition.salePrice < edition.price ? `Save ₦${(edition.price - edition.salePrice).toLocaleString()}` : "Best choice"}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="product-format-pager" aria-label="Format selection pager">
            {editionCards.map((edition, index) => (
              <button
                key={`${edition.format || edition.displayLabel}-pager`}
                type="button"
                className={`format-pager-dot ${index === formatIndex ? "active" : ""}`}
                onClick={() => setFormatIndex(index)}
                aria-label={`Select format ${index + 1}`}
              />
            ))}
          </div>

          <div className="product-bottom-actions">
            <button
              type="button"
              className="primary large"
              disabled={addLoading}
              onClick={async () => {
                setAddError("");
                setAddSuccess(false);
                setAddLoading(true);

                const result = await addToCart(product, 1, selectedEdition);
                setAddLoading(false);

                if (result.success) {
                  navigate("/checkout");
                } else {
                  setAddError(result.message || "Failed to add item to cart.");
                }
              }}
            >
              {addLoading ? "Preparing..." : "Proceed to checkout"}
            </button>

            <button
              type="button"
              className="secondary large"
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
              {addLoading ? "Adding..." : "Add to cart"}
            </button>
          </div>

          {(addSuccess || addError) && (
            <div className={`inline-toast ${addSuccess ? "success" : "error"}`}>
              {addSuccess ? "Added to cart" : addError}
            </div>
          )}

          {(product.digitalFiles?.pdf?.key || product.digitalFiles?.epub?.key) && (
            <div className="digital-book-downloads compact-downloads">
              <strong>Digital editions</strong>
              <div>
                {product.digitalFiles?.pdf?.key && (
                  <button type="button" onClick={async () => { try { setDownloadMessage(""); const result = await getDigitalBookDownloadUrl(product._id, "pdf"); window.location.href = result.downloadUrl; } catch (error) { setDownloadMessage(error.message || "Sign in and complete payment to download this book."); } }}>PDF</button>
                )}
                {product.digitalFiles?.epub?.key && (
                  <button type="button" onClick={async () => { try { setDownloadMessage(""); const result = await getDigitalBookDownloadUrl(product._id, "epub"); window.location.href = result.downloadUrl; } catch (error) { setDownloadMessage(error.message || "Sign in and complete payment to download this book."); } }}>EPUB</button>
                )}
              </div>
              {downloadMessage && <p className="inline-toast error">{downloadMessage}</p>}
            </div>
          )}

          <div className="product-extra-panel">
            <div className="product-extra-box">
              <h3>About this book</h3>
              <p>{product.fullDescription || product.shortDescription || "No description available yet."}</p>
            </div>

            <div className="product-extra-box">
              <h3>More details</h3>
              {product.category && <p><strong>Category:</strong> {product.category}</p>}
              {product.brand && <p><strong>Author:</strong> {product.brand}</p>}
              {product.vendor && <p><strong>Publisher:</strong> {product.vendor}</p>}
              {(product.sku || product.gtin) && <p><strong>Catalog:</strong> {product.sku || product.gtin}</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
