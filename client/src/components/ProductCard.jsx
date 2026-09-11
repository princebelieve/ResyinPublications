import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const [imageFailed, setImageFailed] = useState(false);
  const isOnSale = product.salePrice != null && Number(product.salePrice) < Number(product.price);
  const price = isOnSale ? product.salePrice : product.price;
  const inStock = Number(product.stock || 0) > 0;

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
        {(product.author || product.brand) && <Link className="store-book-author" onClick={(event) => event.stopPropagation()} to={`/collection?author=${encodeURIComponent(product.author || product.brand)}`}>by {product.author || product.brand}</Link>}

        {product.shortDescription && (
          <div className="card-description-block">
            <p
              className="muted card-short-description card-clickable-description"
            >
              {product.shortDescription}
            </p>
          </div>
        )}

        <div className="card-price-block">
          <div className="card-price-row">
            <span className="card-price-label">Book price</span>
            <span className="card-price">₦{Number(price || 0).toLocaleString()}</span>
          </div>

          {isOnSale && <small className="card-original-price">Was ₦{Number(product.price).toLocaleString()}</small>}

          <div className={`card-stock ${inStock ? "in-stock" : "out-of-stock"}`}>
            {inStock ? "Available to order" : "Currently unavailable"}
          </div>
        </div>

        <div className="card-actions">
          <button type="button" className="resyin-card-action" onClick={(event) => { event.stopPropagation(); openBook(); }}>View book</button>
          <button className="wa resyin-card-action" onClick={(event) => { event.stopPropagation(); window.open(`mailto:info@resyinpublications.com?subject=Book enquiry: ${encodeURIComponent(product.name)}`, "_blank"); }}>Enquire</button>
        </div>
      </div>
    </article>
  );
}
