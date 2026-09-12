import { useState } from "react";
import { Save } from "lucide-react";
import { updateProductApi } from "../services/api";
import { getToken } from "../utils/auth";

const formatOptions = [["paperback", "Paperback"], ["hardcover", "Hardcover"], ["pdf", "PDF"], ["epub", "EPUB"]];
const formatCode = { paperback: "PB", hardcover: "HC", pdf: "PDF", epub: "EPUB" };
const slugify = (value) => String(value || "book").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 24) || "book";
const generateEditionSku = (title, format) => `RSY-${slugify(title)}-${formatCode[format] || String(format).toUpperCase().slice(0, 3)}`;
const defaultFormat = (format, label, title = "") => ({ format, label, price: 0, salePrice: "", stock: 0, isbn: "", sku: generateEditionSku(title, format), shippingWeight: 0 });

export default function BookEditionsForm({ product, onSaved }) {
  const existing = product.editions?.length ? product.editions : [];
  const [editions, setEditions] = useState(existing.map((item) => ({ ...item, sku: item.sku || generateEditionSku(product?.name || "", item.format) })));
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleFormat(format, label) {
    setEditions((current) => current.some((item) => item.format === format)
      ? current.filter((item) => item.format !== format)
      : [...current, defaultFormat(format, label, product?.name || "")]);
  }

  function change(format, event) {
    const { name, value } = event.target;
    setEditions((current) => current.map((item) => item.format === format ? { ...item, [name]: value } : item));
  }

  async function save(event) {
    event.preventDefault();
    if (!editions.length) { setMessage("Select at least one available book format."); return; }
    if (editions.some((item) => Number(item.price) < 0)) { setMessage("Enter a valid price for every selected format."); return; }
    try {
      setSaving(true); setMessage("");
      const data = new FormData();
      data.append("editions", JSON.stringify(editions.map((item) => ({ ...item, price: Number(item.price || 0), salePrice: item.salePrice === "" ? null : Number(item.salePrice), stock: ["pdf", "epub"].includes(item.format) ? 0 : Number(item.stock || 0), shippingWeight: Number(item.shippingWeight || 0) }))));
      const saved = await updateProductApi(product._id, data, getToken());
      onSaved?.(saved);
      setMessage("Book availability saved.");
    } catch (error) { setMessage(error.message || "Unable to save book availability."); }
    finally { setSaving(false); }
  }

  return <section className="book-editions-panel"><div className="book-editions-heading"><div><span className="eyebrow">ONE BOOK, MULTIPLE OPTIONS</span><h2>Available formats</h2><p>This is the same book. Select the formats customers can buy, then set the format-specific price, stock, and ISBN.</p></div></div><form onSubmit={save}><div className="book-format-checks">{formatOptions.map(([format, label]) => <label className="wizard-checkbox" key={format}><input type="checkbox" checked={editions.some((item) => item.format === format)} onChange={() => toggleFormat(format, label)} /><span>{label}</span></label>)}</div>{editions.length > 0 && <div className="book-format-settings">{editions.map((item) => <div className="book-format-setting" key={item.format}><strong>{item.label || item.format}</strong><input required type="number" min="0" name="price" placeholder="Price" value={item.price} onChange={(event) => change(item.format, event)} /><input type="number" min="0" name="salePrice" placeholder="Sale price" value={item.salePrice ?? ""} onChange={(event) => change(item.format, event)} />{!["pdf", "epub"].includes(item.format) && <input type="number" min="0" name="stock" placeholder="Stock" value={item.stock} onChange={(event) => change(item.format, event)} />}<input name="isbn" placeholder="ISBN" value={item.isbn || ""} onChange={(event) => change(item.format, event)} /><input name="sku" placeholder="Auto-generated SKU" value={item.sku || generateEditionSku(product?.name || "", item.format)} readOnly aria-readonly="true" /></div>)}</div>}<button className="primary" type="submit" disabled={saving}><Save size={16} /> {saving ? "Saving availability..." : "Save book availability"}</button>{message && <p className="inline-toast success" role="status">{message}</p>}</form></section>;
}
