import { useState } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import PRODUCT_CATEGORY_OPTIONS from "../config/productCategoryOptions";

const blankFormat = {
  format: "paperback",
  label: "Paperback",
  price: "",
  salePrice: "",
  stock: 0,
  isbn: "",
  sku: "",
  shippingWeight: 0,
};

export default function BookUploadForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    brand: "",
    vendor: "",
    shortDescription: "",
    fullDescription: "",
    coverImage: null,
    gallery: [],
    featured: false,
    status: "active",
  });
  const [formats, setFormats] = useState([{ ...blankFormat }]);
  const [pdfFile, setPdfFile] = useState(null);
  const [epubFile, setEpubFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function changeFormat(index, event) {
    const { name, value } = event.target;
    setFormats((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: value } : item));
  }

  function addFormat() {
    setFormats((current) => [...current, { ...blankFormat }]);
  }

  function removeFormat(index) {
    setFormats((current) => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const data = new FormData();
      ["name", "category", "brand", "vendor", "shortDescription", "fullDescription", "featured", "status"].forEach((field) => data.append(field, form[field]));
      data.append("editions", JSON.stringify(formats.map((item) => ({
        ...item,
        price: Number(item.price || 0),
        salePrice: item.salePrice === "" ? null : Number(item.salePrice),
        stock: Number(item.stock || 0),
        shippingWeight: Number(item.shippingWeight || 0),
      }))));
      if (form.coverImage) data.append("coverImage", form.coverImage);
      form.gallery.forEach((file) => data.append("gallery", file));
      if (pdfFile) data.append("pdfFile", pdfFile);
      if (epubFile) data.append("epubFile", epubFile);
      await onSubmit(data);
    } catch (error) {
      setMessage(error.message || "Book could not be uploaded.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="product-wizard-shell book-upload-form" onSubmit={submit}>
      <section className="wizard-card wizard-step">
        <div className="wizard-step-header"><h2>Book information</h2><p>Enter the title, author, publisher, and descriptions readers will see.</p></div>
        <div className="wizard-grid">
          <input required name="name" placeholder="Book title" value={form.name} onChange={change} />
          <select required name="category" value={form.category} onChange={change}><option value="">Select subject</option>{PRODUCT_CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}</select>
          <input required name="brand" placeholder="Author" value={form.brand} onChange={change} />
          <input name="vendor" placeholder="Publisher" value={form.vendor} onChange={change} />
        </div>
        <textarea required name="shortDescription" placeholder="Short description" value={form.shortDescription} onChange={change} />
        <textarea required name="fullDescription" placeholder="Full book description" value={form.fullDescription} onChange={change} />
      </section>

      <section className="wizard-card wizard-step">
        <div className="wizard-step-header"><h2>Book formats and prices</h2><p>Choose paperback, hardcover, PDF, or EPUB. Each format can have its own price, stock, ISBN, and SKU.</p></div>
        {formats.map((item, index) => <div className="book-upload-format" key={`${item.format}-${index}`}>
          <select aria-label={`Format ${index + 1}`} name="format" value={item.format} onChange={(event) => changeFormat(index, event)}><option value="paperback">Paperback</option><option value="hardcover">Hardcover</option><option value="pdf">PDF</option><option value="epub">EPUB</option></select>
          <input name="label" placeholder="Format label" value={item.label} onChange={(event) => changeFormat(index, event)} />
          <input required type="number" min="0" name="price" placeholder="Price (NGN)" value={item.price} onChange={(event) => changeFormat(index, event)} />
          <input type="number" min="0" name="salePrice" placeholder="Sale price" value={item.salePrice} onChange={(event) => changeFormat(index, event)} />
          <input type="number" min="0" name="stock" placeholder="Stock" value={item.stock} onChange={(event) => changeFormat(index, event)} />
          <input name="isbn" placeholder="ISBN" value={item.isbn} onChange={(event) => changeFormat(index, event)} />
          <input name="sku" placeholder="SKU" value={item.sku} onChange={(event) => changeFormat(index, event)} />
          <input type="number" min="0" step="0.01" name="shippingWeight" placeholder="Weight kg" value={item.shippingWeight} onChange={(event) => changeFormat(index, event)} />
          <button type="button" aria-label="Remove format" onClick={() => removeFormat(index)}><Trash2 size={16} /></button>
        </div>)}
        <button type="button" className="secondary-button" onClick={addFormat}><Plus size={16} /> Add another format</button>
      </section>

      <section className="wizard-card wizard-step">
        <div className="wizard-step-header"><h2>Book cover and digital files</h2><p>Upload the cover image and, if applicable, the PDF or EPUB buyers will receive after payment.</p></div>
        <label>Book cover<input required type="file" accept="image/*" onChange={(event) => setForm((current) => ({ ...current, coverImage: event.target.files?.[0] || null }))} /></label>
        <label>Additional images<input type="file" accept="image/*" multiple onChange={(event) => setForm((current) => ({ ...current, gallery: Array.from(event.target.files || []) }))} /></label>
        <div className="book-upload-files"><label>PDF file<input type="file" accept="application/pdf,.pdf" onChange={(event) => setPdfFile(event.target.files?.[0] || null)} /></label><label>EPUB file<input type="file" accept="application/epub+zip,.epub" onChange={(event) => setEpubFile(event.target.files?.[0] || null)} /></label></div>
        <label className="wizard-checkbox"><input type="checkbox" name="featured" checked={form.featured} onChange={change} /><span>Feature this book in the bookstore</span></label>
      </section>

      {message && <p className="inline-toast error" role="alert">{message}</p>}
      <button className="primary" type="submit" disabled={saving}><Upload size={16} /> {saving ? "Uploading book..." : "Upload book"}</button>
    </form>
  );
}
