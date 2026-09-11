import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const isOnSale = product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const price = isOnSale ? product.salePrice : product.price;
  const inStock = Number(product.stock || 0) > 0;
  const availableFormats = Array.isArray(product.editions)
    ? product.editions
        .filter((edition) => edition && edition.format)
        .map((edition) => ({
          format: edition.format,
          label: edition.label || edition.format,
        }))
    : [];

  useEffect(() => setImageFailed(false), [product.coverImage]);

  const openBook = () => navigate(`/product/${product._id}`);

  return (
    <article
      className="card resyin-book-card"
      role="link"
      tabIndex={0}
      onClick={openBook}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openBook();
        }
      }}
      aria-label={`View ${product.name}`}
    >
      <div className="card-image-wrap" aria-hidden="true">
        {product.coverImage && !imageFailed ? (
          <img
            src={product.coverImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={() => {
              console.warn("Product image could not be loaded", {
                productId: product._id,
                name: product.name,
                imageUrl: product.coverImage,
              });
              setImageFailed(true);
            }}
          />
        ) : (
          <div className="card-image-fallback" role="img" aria-label={`${product.name} image unavailable`}>
            Image unavailable
          </div>
        )}
      </div>

      <div className="card-body">
        <span className="store-book-category">{product.category || "Book"}</span>
        <h3>{product.name}</h3>

        {(product.author || product.brand) && (
          <Link
            className="store-book-author"
            onClick={(event) => event.stopPropagation()}
            to={`/collection?author=${encodeURIComponent(product.author || product.brand)}`}
          >
            by {product.author || product.brand}
          </Link>
        )}

        {availableFormats.length > 0 && (
          <div className="book-format-list" aria-label="Available formats">
            {availableFormats.map((entry) => (
              <span key={`${product._id}-${entry.format}`} className="book-format-pill">
                {entry.label}
              </span>
            ))}
          </div>
        )}

        <div className="card-price-block">
          <div className="card-price-row">
            <span className="card-price">₦{Number(price || 0).toLocaleString()}</span>
          </div>

          {isOnSale && <small className="card-original-price">Was ₦{Number(product.price).toLocaleString()}</small>}

          <div className={`card-stock ${inStock ? "in-stock" : "out-of-stock"}`}>
            {inStock ? "Available" : "Unavailable"}
          </div>
        </div>
      </div>
    </article>
  );
}
