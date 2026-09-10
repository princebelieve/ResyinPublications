//client/src/pages/Collection.jsx
import { useEffect, useMemo, useState } from "react";

import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";
import Footer from "../components/Footer";
import RelatedProductCarousel from "../components/RelatedProductCarousel";
import { useSearchParams } from "react-router-dom";



import { getProducts } from "../services/api";

export default function Collection() {


  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [params, setParams] = useSearchParams();
  const searchQuery = params.get("q") || "";
  const category = params.get("category") || "";
  const author = params.get("author") || "";
  const sortOrder = params.get("sort") || "newest";
  function updateFilter(key, value) { setParams((current) => { const next = new URLSearchParams(current); if (value) next.set(key, value); else next.delete(key); return next; }); }
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
  const authors = [...new Set(products.map((p) => p.author || p.brand).filter(Boolean))].sort();


  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const scoped = products.filter((p) => (!category || p.category === category) && (!author || (p.author || p.brand) === author));
    const matches = !query
      ? scoped
      : scoped.filter((product) =>
      [
        product.name,
        product.shortDescription,
        product.fullDescription,
        product.category,
        product.brand,
        product.author,
        product.sku,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
      );

    return [...matches].sort((a, b) => {
      switch (sortOrder) {
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name-desc":
          return (b.name || "").localeCompare(a.name || "");
        case "price-low":
          return Number(a.salePrice != null && Number(a.salePrice) < Number(a.price) ? a.salePrice : a.price ?? 0) - Number(b.salePrice != null && Number(b.salePrice) < Number(b.price) ? b.salePrice : b.price ?? 0);
        case "price-high":
          return Number(b.salePrice != null && Number(b.salePrice) < Number(b.price) ? b.salePrice : b.price ?? 0) - Number(a.salePrice != null && Number(a.salePrice) < Number(a.price) ? a.salePrice : a.price ?? 0);
        case "newest":
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
  }, [products, searchQuery, sortOrder, category, author]);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProducts();
        if (!Array.isArray(data)) {
          throw new Error("The product service returned an unexpected response.");
        }

        setProducts(data.filter((product) => product && typeof product === "object"));
      } catch (error) {
        console.error("Unable to load products", error);
        setProducts([]);
        setLoadError(
          `We could not load the RESYIN catalog right now${error?.message ? `: ${error.message}` : ". Please refresh the page in a moment."}`,
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  return (
    <>
      <Navbar />

      <main className="store-catalog">
        <div className="store-catalog-heading"><span className="store-eyebrow">THE RESYIN BOOKSTORE</span><h1>Find your next read</h1><p>Books from Prof. Johnson A. Egonmwan and a growing community of authors.</p></div>
        <div className="store-catalog-layout"><aside className="store-filters"><h2>Browse books</h2>
          <label htmlFor="category-filter">Subject</label><select id="category-filter" value={category} onChange={(e) => updateFilter("category", e.target.value)}><option value="">All subjects</option>{categories.map((c) => <option key={c}>{c}</option>)}</select>
          <label htmlFor="author-filter">Author</label><select id="author-filter" value={author} onChange={(e) => updateFilter("author", e.target.value)}><option value="">All authors</option>{author && !authors.includes(author) && <option>{author}</option>}{authors.map((a) => <option key={a}>{a}</option>)}</select>
          <button className="store-secondary" onClick={() => setParams({})}>Clear filters</button>
        </aside><div className="store-results"><div className="store-results-tools">
            <div className="product-search" role="search">
              <label htmlFor="product-search">Search books</label>
              <input
                id="product-search"
                type="search"
                value={searchQuery}
                onChange={(event) => updateFilter("q", event.target.value)}
                placeholder="Search titles, subjects, authors, or catalog codes"
                autoComplete="off"
              />
            </div>

            <div className="product-sort">
              <label htmlFor="product-sort">Sort by</label>
              <select
                id="product-sort"
                value={sortOrder}
                onChange={(event) => updateFilter("sort", event.target.value)}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="name-asc">Name: A–Z</option>
                <option value="name-desc">Name: Z–A</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </div>

            {!loading && !loadError && <p className="store-result-count" role="status">{filteredProducts.length} book{filteredProducts.length === 1 ? "" : "s"} found</p>}
          </div>

          {!loading && filteredProducts.length > 0 && <RelatedProductCarousel products={filteredProducts} />}

          <div>
            {loading ? (
              <div className="grid">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="card skeleton-card">
                    <div className="skeleton-image" />

                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-price" />
                    <div className="skeleton-button" />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className="product-load-error" role="alert">
                <p>{loadError}</p>
                <button type="button" onClick={() => window.location.reload()}>
                  Try again
                </button>
              </div>
            ) : (
              filteredProducts.length > 0 ? (
                <ProductGrid products={filteredProducts} />
              ) : (
                <p className="product-search-empty">
                  No books match “{searchQuery.trim()}”. Try another title, subject, or author, or clear your filters.
                </p>
              )
            )}
          </div>
        </div>
      </div></main>
      <Footer />
    </>
  );
}
