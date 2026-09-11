import { useState } from "react";
import { Save } from "lucide-react";
import { updateProductApi } from "../services/api";
import { getToken } from "../utils/auth";

const formatOptions = [["paperback", "Paperback"], ["hardcover", "Hardcover"], ["pdf", "PDF"], ["epub", "EPUB"]];
const defaultFormat = (format, label) => ({ format, label, price: 0, salePrice: "", stock: 0, isbn: "", sku: "", shippingWeight: 0 });

export default function BookEditionsForm({ product, onSaved }) {
  const existing = product.editions?.length ? product.editions : [];
  const [editions, setEditions] = useState(existing);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function toggleFormat(format, label) {
    setEditions((current) => current.some((item) => item.format === format) ? current.filter((item) => item.format !== format) : [...current, defaultFormat(format, label)]);
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
      data.append("editions", JSON.stringify(editions.map((item) => ({ ...item, price: Number(item.price || 0), salePrice: item.salePrice === "" ? null : Number(item.salePrice), stock: Number(item.stock || 0), shippingWeight: Number(item.shippingWeight || 0) }))));
      const saved = await updateProductApi(product._id, data, getToken());
      onSaved?.(saved);
      setMessage("Book availability saved.");
    } catch (error) { setMessage(error.message || "Unable to save book availability."); }
    finally { setSaving(false); }
  }

  return <section className="book-editions-panel"><div className="book-editions-heading"><div><span className="eyebrow">ONE BOOK, MULTIPLE OPTIONS</span><h2>Available formats</h2><p>This is the same book. Select the formats customers can buy, then set the format-specific price, stock, ISBN, or SKU.</p></div></div><form onSubmit={save}><div className="book-format-checks">{formatOptions.map(([format, label]) => <label className="wizard-checkbox" key={format}><input type="checkbox" checked={editions.some((item) => item.format === format)} onChange={() => toggleFormat(format, label)} /><span>{label}</span></label>)}</div>{editions.length > 0 && <div className="book-format-settings">{editions.map((item) => <div className="book-format-setting" key={item.format}><strong>{item.label || item.format}</strong><input required type="number" min="0" name="price" placeholder="Price" value={item.price} onChange={(event) => change(item.format, event)} /><input type="number" min="0" name="salePrice" placeholder="Sale price" value={item.salePrice ?? ""} onChange={(event) => change(item.format, event)} /><input type="number" min="0" name="stock" placeholder="Stock" value={item.stock} onChange={(event) => change(item.format, event)} /><input name="isbn" placeholder="ISBN" value={item.isbn || ""} onChange={(event) => change(item.format, event)} /><input name="sku" placeholder="SKU" value={item.sku || ""} onChange={(event) => change(item.format, event)} /></div>)}</div>}<button className="primary" type="submit" disabled={saving}><Save size={16} /> {saving ? "Saving availability..." : "Save book availability"}</button>{message && <p className="inline-toast success" role="status">{message}</p>}</form></section>;
}
