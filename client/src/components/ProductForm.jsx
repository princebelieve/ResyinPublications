import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PRODUCT_CATEGORY_OPTIONS from "../config/productCategoryOptions";

const initialForm = { name: "", shortDescription: "", fullDescription: "", category: "", price: "", salePrice: "", currency: "NGN", stock: 0, featured: false, status: "active", brand: "", vendor: "", gtin: "", nafdacNumber: "", googleProductCategory: "", condition: "new", ingredients: "", directions: "", warnings: "", netContent: "", countryOfOrigin: "", coverImage: null, gallery: [] };

export default function ProductForm({ onSubmit, editingProduct, onCancelEdit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!editingProduct) return setForm(initialForm);
    setForm({ ...initialForm, ...editingProduct, salePrice: editingProduct.salePrice ?? "", coverImage: null, gallery: [] });
  }, [editingProduct]);
  const change = ({ target: { name, value, type, checked } }) => setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }));
  async function submit(event) {
    event.preventDefault(); setIsUploading(true); setMessage("");
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => { if (!['coverImage', 'gallery', '_id', 'createdAt', 'updatedAt', '__v'].includes(key) && value !== null && value !== undefined) data.append(key, value); });
      if (form.coverImage instanceof File) data.append("coverImage", form.coverImage);
      form.gallery.forEach((file) => data.append("gallery", file));
      const saved = await onSubmit(data);
      setMessage(editingProduct ? "Book updated successfully." : "Book published successfully.");
      if (!editingProduct) setForm(initialForm);
      setTimeout(() => navigate(saved?._id ? `/product/${saved._id}` : "/collection"), 700);
    } catch (error) { setMessage(error.message || "Product could not be saved."); } finally { setIsUploading(false); }
  }
  return <div className="product-wizard-shell"><div className="wizard-header"><div><span className="wizard-label">RESYIN BOOKSTORE</span><h1>{editingProduct ? "Edit Book" : "Add Book"}</h1></div></div><form onSubmit={submit} className="wizard-card"><section className="wizard-step"><div className="wizard-step-header"><h2>Book information</h2><p>Book descriptions and author details and Merchant listing data.</p></div><div className="wizard-grid"><input required name="name" placeholder="Book title" value={form.name} onChange={change} /><select required name="category" value={form.category} onChange={change}><option value="">Select category</option>{PRODUCT_CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}</select><input name="brand" placeholder="Author" value={form.brand} onChange={change} /><input name="vendor" placeholder="Publisher" value={form.vendor} onChange={change} /></div><textarea required name="shortDescription" placeholder="Short description" value={form.shortDescription} onChange={change} /><textarea required name="fullDescription" placeholder="Full description" value={form.fullDescription} onChange={change} /></section><section className="wizard-step"><div className="wizard-step-header"><h2>Price & availability</h2><p>Set the book price, stock status, and visibility for readers.</p></div><div className="wizard-grid"><input required type="number" min="0" name="price" placeholder="Regular price (NGN)" value={form.price} onChange={change} /><input type="number" min="0" name="salePrice" placeholder="Sale price (optional, NGN)" value={form.salePrice} onChange={change} /><span className="muted">Currency: NGN</span><input required type="number" min="0" name="stock" placeholder="Stock quantity" value={form.stock} onChange={change} /></div><label className="wizard-checkbox"><input type="checkbox" name="featured" checked={form.featured} onChange={change} /><span>Show as a featured book</span></label></section><section className="wizard-step"><div className="wizard-step-header"><h2>Book identifiers</h2></div><div className="wizard-grid"><input name="gtin" placeholder="ISBN / barcode (if supplied)" value={form.gtin} onChange={change} /><input name="googleProductCategory" placeholder="Google product category (optional)" value={form.googleProductCategory} onChange={change} /></div></section><section className="wizard-step"><div className="wizard-step-header"><h2>Book covers</h2><p>Shipping is calculated as one flat destination rate at checkout.</p></div><div className="upload-box"><p>Main book cover</p>{editingProduct?.coverImage && <><img className="product-form-current-image" src={editingProduct.coverImage} alt={`Current image for ${editingProduct.name}`} /><p className="muted">Current image is retained unless you choose a replacement.</p></>}<input type="file" accept="image/*" onChange={(e) => setForm((current) => ({ ...current, coverImage: e.target.files?.[0] || null }))} /></div><div className="upload-box"><p>Additional images</p>{editingProduct?.gallery?.length > 0 && <p className="muted">{editingProduct.gallery.length} existing gallery image{editingProduct.gallery.length === 1 ? "" : "s"} retained unless you upload replacements.</p>}<input type="file" multiple accept="image/*" onChange={(e) => setForm((current) => ({ ...current, gallery: Array.from(e.target.files || []) }))} /></div></section>{message && <p className="upload-status">{message}</p>}<div className="wizard-actions"><button className="wizard-primary-btn" disabled={isUploading}>{isUploading ? "Saving…" : editingProduct ? "Update book" : "Publish book"}</button>{editingProduct && <button type="button" className="wizard-danger-btn" onClick={onCancelEdit}>Cancel</button>}</div></form></div>;
}
