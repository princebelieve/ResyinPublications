import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import PRODUCT_CATEGORY_OPTIONS from "../config/productCategoryOptions";

const STORAGE_KEY = "resyin-book-upload-draft";
const formatOptions = [["paperback", "Paperback"], ["hardcover", "Hardcover (optional)"], ["pdf", "PDF"], ["epub", "EPUB"]];
const formatCode = { paperback: "PB", hardcover: "HC", pdf: "PDF", epub: "EPUB" };
const slugify = (value) => String(value || "book").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "book";
const generatedSku = (title, format) => `RSY-${slugify(title)}-${formatCode[format] || String(format).toUpperCase().slice(0, 3)}`;
const emptyFormat = (format, label) => ({ format, label, price: "", salePrice: "", stock: 0, isbn: "", sku: generatedSku("", format), shippingWeight: 0 });
const blankForm = { name: "", category: "", brand: "", vendor: "", shortDescription: "", fullDescription: "", coverImage: null, gallery: [], featured: false, status: "active" };

function readDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function BookUploadForm({ onSubmit, editingProduct = null }) {
  const [form, setForm] = useState(blankForm);
  const [formats, setFormats] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  const [epubFile, setEpubFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [coverPreview, setCoverPreview] = useState(editingProduct?.coverImage || "");

  useEffect(() => {
    if (!form.coverImage || !(form.coverImage instanceof File)) {
      setCoverPreview(editingProduct?.coverImage || "");
      return;
    }

    const previewUrl = URL.createObjectURL(form.coverImage);
    setCoverPreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [form.coverImage, editingProduct?.coverImage]);

  useEffect(() => {
    if (editingProduct) {
      setForm({
        ...blankForm,
        ...editingProduct,
        name: editingProduct.name || "",
        category: editingProduct.category || "",
        brand: editingProduct.brand || "",
        vendor: editingProduct.vendor || "",
        shortDescription: editingProduct.shortDescription || "",
        fullDescription: editingProduct.fullDescription || "",
        featured: Boolean(editingProduct.featured),
        status: editingProduct.status || "active",
        coverImage: null,
        gallery: [],
      });
      setFormats((editingProduct.editions || []).map((item) => ({
        ...emptyFormat(item.format, item.label || item.format),
        ...item,
        price: item.price ?? "",
        salePrice: item.salePrice ?? "",
        stock: item.stock ?? 0,
        isbn: item.isbn || "",
        sku: item.sku || generatedSku(editingProduct.name || form.name, item.format),
        shippingWeight: item.shippingWeight ?? 0,
      })));
      return;
    }

    const draft = readDraft();
    if (draft?.form || draft?.formats?.length) {
      setForm({ ...blankForm, ...(draft.form || {}) });
      setFormats(Array.isArray(draft.formats) ? draft.formats : []);
      return;
    }

    setForm(blankForm);
    setFormats([]);
  }, [editingProduct]);

  useEffect(() => {
    if (editingProduct) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, formats }));
  }, [form, formats, editingProduct]);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function toggleFormat(format, label) {
    setFormats((current) => {
      if (current.some((item) => item.format === format)) return current.filter((item) => item.format !== format);
      return [...current, { ...emptyFormat(format, label), sku: generatedSku(form.name, format) }];
    });
  }

  function changeFormat(format, event) {
    const { name, value } = event.target;
    setFormats((current) => current.map((item) => item.format === format ? { ...item, [name]: value, ...(name === "sku" ? {} : {}) } : item));
  }

  useEffect(() => {
    setFormats((current) => current.map((item) => ({
      ...item,
      sku: item.sku || generatedSku(form.name, item.format),
    })));
  }, [form.name]);

  async function submit(event) {
    event.preventDefault();
    const title = String(form.name || "").trim();
    const author = String(form.brand || "").trim();
    const hasCover = Boolean(form.coverImage) || Boolean(editingProduct?.coverImage);

    if (!title) { setMessage("Enter the book title."); return; }
    if (!author) { setMessage("Enter the author name."); return; }
    if (!hasCover) { setMessage("Add a cover image for the book."); return; }
    if (!formats.length) { setMessage("Select at least one available book format."); return; }

    setSaving(true); setMessage("");
    try {
      const data = new FormData();
      ["name", "category", "brand", "vendor", "shortDescription", "fullDescription", "featured", "status"].forEach((field) => data.append(field, form[field]));
      data.append("editions", JSON.stringify(formats.map((item) => ({ ...item, price: Number(item.price || 0), salePrice: item.salePrice === "" ? null : Number(item.salePrice), stock: Number(item.stock || 0), shippingWeight: Number(item.shippingWeight || 0) }))));
      if (form.coverImage) data.append("coverImage", form.coverImage);
      form.gallery.forEach((file) => data.append("gallery", file));
      if (pdfFile) data.append("pdfFile", pdfFile);
      if (epubFile) data.append("epubFile", epubFile);
      await onSubmit(data);
      if (!editingProduct) {
        localStorage.removeItem(STORAGE_KEY);
        setForm(blankForm);
        setFormats([]);
        setPdfFile(null);
        setEpubFile(null);
      }
    } catch (error) { setMessage(error.message || "Book could not be uploaded."); }
    finally { setSaving(false); }
  }

  return <form className="product-wizard-shell book-upload-form" onSubmit={submit}>
    <section className="wizard-card wizard-step">
      <div className="wizard-step-header"><h2>Book information</h2><p>Keep it simple: title, author, and cover are the essentials. Everything else can be filled in later if needed.</p></div>
      <div className="book-upload-primary-layout">
        <div className="book-upload-cover-panel">
          <div className="book-upload-cover-box">
            {coverPreview ? <img src={coverPreview} alt="Book cover preview" className="book-upload-cover-preview" /> : <div className="book-upload-cover-placeholder"><span>Cover</span></div>}
            <label className="book-upload-cover-input">Book cover<input required={!editingProduct} type="file" accept="image/*" onChange={(event) => setForm((current) => ({ ...current, coverImage: event.target.files?.[0] || null }))} /></label>
          </div>
        </div>

        <div className="book-upload-meta-panel">
          <div className="wizard-grid"><input name="name" placeholder="Book title" value={form.name} onChange={change} /><select name="category" value={form.category} onChange={change}><option value="">Select subject</option>{PRODUCT_CATEGORY_OPTIONS.map((category) => <option key={category}>{category}</option>)}</select><input name="brand" placeholder="Author" value={form.brand} onChange={change} /><input name="vendor" placeholder="Publisher (optional)" value={form.vendor} onChange={change} /></div>
          <textarea name="shortDescription" placeholder="Short description (optional)" value={form.shortDescription} onChange={change} />
          <textarea name="fullDescription" placeholder="Full book description (optional)" value={form.fullDescription} onChange={change} />
        </div>
      </div>
    </section>
    <section className="wizard-card wizard-step"><div className="wizard-step-header"><h2>Available formats</h2><p>Check only the formats this book actually offers. Hardcover stays optional, and the rest of the metadata can be filled in later.</p></div><div className="book-format-checks">{formatOptions.map(([format, label]) => <label className="wizard-checkbox" key={format}><input type="checkbox" checked={formats.some((item) => item.format === format)} onChange={() => toggleFormat(format, label)} /><span>{label}</span></label>)}</div>{formats.length > 0 && <div className="book-format-settings">{formats.map((item) => <div className="book-format-setting" key={item.format}><strong>{item.label}</strong><input type="number" min="0" name="price" placeholder="Price (optional)" value={item.price} onChange={(event) => changeFormat(item.format, event)} /><input type="number" min="0" name="salePrice" placeholder="Sale price (optional)" value={item.salePrice} onChange={(event) => changeFormat(item.format, event)} /><input type="number" min="0" name="stock" placeholder="Stock (optional)" value={item.stock} onChange={(event) => changeFormat(item.format, event)} /><input name="isbn" placeholder="ISBN (optional)" value={item.isbn} onChange={(event) => changeFormat(item.format, event)} /><input name="sku" placeholder="Auto-generated SKU" value={item.sku || generatedSku(form.name, item.format)} readOnly aria-readonly="true" /></div>)}</div>}</section>
    <section className="wizard-card wizard-step"><div className="wizard-step-header"><h2>Book files</h2><p>Cover is required. Other files can be added later when the book is ready.</p></div><label>Additional images<input type="file" accept="image/*" multiple onChange={(event) => setForm((current) => ({ ...current, gallery: Array.from(event.target.files || []) }))} /></label>{formats.some((item) => item.format === "pdf") && <label>PDF file<input type="file" accept="application/pdf,.pdf" onChange={(event) => setPdfFile(event.target.files?.[0] || null)} /></label>}{formats.some((item) => item.format === "epub") && <label>EPUB file<input type="file" accept="application/epub+zip,.epub" onChange={(event) => setEpubFile(event.target.files?.[0] || null)} /></label>}<label className="wizard-checkbox"><input type="checkbox" name="featured" checked={form.featured} onChange={change} /><span>Feature this book in the bookstore</span></label></section>
    {message && <p className="inline-toast error" role="alert">{message}</p>}<button className="primary" type="submit" disabled={saving}><Upload size={16} /> {saving ? (editingProduct ? "Saving book..." : "Uploading book...") : (editingProduct ? "Save book" : "Upload book")}</button>
  </form>;
}
