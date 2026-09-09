import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import ProductForm from "../components/ProductForm";
import useAuth from "../context/AuthContext";
import {
  createProductApi,
  getAdminProductById,
  updateProductApi,
} from "../services/api";
import { getToken } from "../utils/auth";

export default function AdminProductForm() {
  const { id } = useParams();
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { isSubadmin } = useAuth();

  useEffect(() => {
    if (!id) return;

    async function loadProduct() {
      setLoading(true);
      try {
        const product = await getAdminProductById(id, getToken());
        setEditingProduct(product);
      } catch (err) {
        console.error(err);
        setError("Unable to load product details.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  async function handleSubmit(formData) {
    if (editingProduct) {
      await updateProductApi(editingProduct._id, formData, getToken());
    } else {
      await createProductApi(formData, getToken());
    }

    navigate("/admin/products");
  }

  return (
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
          <h1>{editingProduct ? "Edit Product" : "Create Product"}</h1>
          <p style={{ marginTop: 8, color: "#555" }}>
            {editingProduct
              ? "Update product details and pricing."
              : "Fill in product details, pricing, inventory, and images."}
          </p>
          {!editingProduct && isSubadmin && (
            <p style={{ marginTop: 8, color: "#8c6a00" }}>
              As a subadmin, new product submissions will be sent for admin
              review and kept hidden until approved.
            </p>
          )}
        </div>

        <button type="button" onClick={() => navigate("/admin/products")}>
          Back to products
        </button>
      </div>

      {loading ? (
        <p>Loading product...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <ProductForm
          onSubmit={handleSubmit}
          editingProduct={editingProduct}
          onCancelEdit={() => navigate("/admin/products")}
        />
      )}
    </div>
  );
}
