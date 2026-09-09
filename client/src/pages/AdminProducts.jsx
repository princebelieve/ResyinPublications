// src/pages/AdminProducts.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/AuthContext";

import {
  getProducts,
  deleteProductApi,
  getAdminProducts,
  approveProductApi,
  rejectProductApi,
  setProductVisibilityApi,
} from "../services/api";
import { getToken } from "../utils/auth";

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { isAdminOrSubadmin } = useAuth();
  const { isAdmin } = useAuth();

  async function loadProducts() {
    try {
      let data;

      if (isAdminOrSubadmin) {
        data = await getAdminProducts(getToken());
      } else {
        data = await getProducts();
      }

      setProducts(Array.isArray(data) ? data : data || []);
    } catch (err) {
      console.error("Unable to load products", err);
      setProducts([]);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminOrSubadmin]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return products;

    return products.filter((product) =>
      [
        product.name,
        product.shortDescription,
        product.fullDescription,
        product.category,
        product.brand,
        product.sku,
        product.gtin,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [products, searchQuery]);

  async function handleDelete(id) {
    const ok = window.confirm("Delete this product?");
    if (!ok) return;

    try {
      await deleteProductApi(id, getToken());
    } catch (err) {
      alert(err.message || "Unable to delete product");
      return;
    }

    loadProducts();
  }

  async function handleApprove(id) {
    try {
      await approveProductApi(id, getToken());
      loadProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to approve");
    }
  }

  async function handleReject(id) {
    try {
      await rejectProductApi(id, getToken());
      loadProducts();
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to reject");
    }
  }

  async function handleVisibility(product) {
    const action = product.hidden ? "unhide" : "hide";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} “${product.name}” for customers?`)) return;

    try {
      const result = await setProductVisibilityApi(
        product._id,
        !product.hidden,
        getToken(),
      );

      if (result?.product) {
        setProducts((currentProducts) =>
          currentProducts.map((currentProduct) =>
            currentProduct._id === result.product._id
              ? result.product
              : currentProduct,
          ),
        );
      } else {
        loadProducts();
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to change product visibility");
    }
  }

  return (
    <>
      <div className="page">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1>Admin Products</h1>
            <p style={{ marginTop: 8, color: "#555" }}>
              Manage product catalog and edit existing listings from the product
              grid.
            </p>
          </div>

          <button type="button" onClick={() => navigate("/admin/products/new")}>
            Add Product
          </button>
        </div>

        <div className="product-search" role="search">
          <label htmlFor="admin-product-search">Search existing products</label>
          <input
            id="admin-product-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Name, category, brand, SKU, or GTIN"
            autoComplete="off"
          />
        </div>

        <div
          style={{
            display: "grid",
            gap: 20,
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            marginTop: 30,
          }}
        >
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              style={{
                border: "1px solid #ddd",
                padding: 20,
                borderRadius: 8,
                background: "#fff",
              }}
            >
              {product.coverImage ? (
                <img
                  src={product.coverImage}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: 180,
                    objectFit: "cover",
                    borderRadius: 6,
                    marginBottom: 12,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: 180,
                    borderRadius: 6,
                    marginBottom: 12,
                    background: "#f3f3f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#777",
                    fontSize: 14,
                  }}
                >
                  No Image
                </div>
              )}

              <h3>{product.name}</h3>
              <p>₦{Number(product.price || 0).toLocaleString()}</p>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/admin/products/edit/${product._id}`)
                  }
                >
                  Edit
                </button>

                {product.pendingApproval && (
                  <span style={{ color: "#b36", fontWeight: 600 }}>
                    Pending Approval
                  </span>
                )}

                {product.pendingDeletion && (
                  <span style={{ color: "#b36", fontWeight: 600 }}>
                    Pending Deletion
                  </span>
                )}

                {isAdmin && (product.pendingApproval || product.pendingDeletion) && (
                  <>
                    <button type="button" onClick={() => handleApprove(product._id)}>
                      {product.pendingDeletion ? "Approve deletion" : "Approve"}
                    </button>
                    <button type="button" onClick={() => handleReject(product._id)}>
                      {product.pendingDeletion ? "Keep product" : "Reject"}
                    </button>
                  </>
                )}

                {isAdmin && !product.pendingDeletion && (
                  <button type="button" onClick={() => handleVisibility(product)}>
                    {product.hidden ? "Unhide product" : "Hide product"}
                  </button>
                )}

                <button type="button" onClick={() => handleDelete(product._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {!filteredProducts.length && (
          <p className="product-search-empty">
            No existing products match “{searchQuery.trim()}”.
          </p>
        )}
      </div>
    </>
  );
}
