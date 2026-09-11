//client/src/components/ProductGrid.jsx
import { BookOpen } from "lucide-react";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products, emptyMessage = "No books are available right now." }) {
  if (!Array.isArray(products)) return null;

  if (products.length === 0) {
    return (
      <div className="store-empty" role="status">
        <BookOpen size={32} />
        <h3>No books available</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid product-grid">
      {products.map((p) => (
        <ProductCard key={p._id || p.id} product={p} />
      ))}
    </div>
  );
}
