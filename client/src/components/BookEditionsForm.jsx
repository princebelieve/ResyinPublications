import { useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { updateProductApi } from "../services/api";
import { getToken } from "../utils/auth";

const blankEdition = { format: "paperback", label: "Paperback", price: 0, salePrice: "", stock: 0, isbn: "", sku: "", shippingWeight: 0 };

export default function BookEditionsForm({ product, onSaved }) {
  const [editions, setEditions] = useState(product.editions?.length ? product.editions : [{ ...blankEdition }]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function change(index, event) {
    const { name, value } = event.target;
    setEditions((current) => current.map((edition, editionIndex) => editionIndex === index ? { ...edition, [name]: value } : edition));
  }

  function addEdition() { setEditions((current) => [...current, { ...blankEdition }]); }
  function removeEdition(index) { setEditions((current) => current.filter((_, editionIndex) => editionIndex !== index)); }

  async function save(event) {
    event.preventDefault();
    try {
      setSaving(true);
      const data = new FormData();
      data.append("editions", JSON.stringify(editions.map((edition) => ({
        ...edition,
        price: Number(edition.price || 0),
        salePrice: edition.salePrice === "" ? null : Number(edition.salePrice),
        stock: Number(edition.stock || 0),
        shippingWeight: Number(edition.shippingWeight || 0),
      }))));
      const saved = await updateProductApi(product._id, data, getToken());
      onSaved?.(saved);
      setMessage("Book editions saved.");
    } catch (error) {
      setMessage(error.message || "Unable to save editions.");
    } finally {
      setSaving(false);
    }
  }

  return <section className="book-editions-panel"><div className="book-editions-heading"><div><span className="eyebrow">PHYSICAL &amp; DIGITAL FORMATS</span><h2>Book editions</h2><p>Set the price, stock, ISBN, SKU, and shipping weight for each format.</p></div><button type="button" onClick={addEdition}><Plus size={16} /> Add edition</button></div><form onSubmit={save}>{editions.map((edition, index) => <div className="book-edition-row" key={`${edition.format}-${index}`}><select name="format" value={edition.format} onChange={(event) => change(index, event)}><option value="paperback">Paperback</option><option value="hardcover">Hardcover</option><option value="pdf">PDF</option><option value="epub">EPUB</option></select><input name="label" placeholder="Label" value={edition.label || ""} onChange={(event) => change(index, event)} /><input type="number" min="0" name="price" placeholder="Price" value={edition.price} onChange={(event) => change(index, event)} /><input type="number" min="0" name="salePrice" placeholder="Sale price" value={edition.salePrice ?? ""} onChange={(event) => change(index, event)} /><input type="number" min="0" name="stock" placeholder="Stock" value={edition.stock} onChange={(event) => change(index, event)} /><input name="isbn" placeholder="ISBN" value={edition.isbn || ""} onChange={(event) => change(index, event)} /><input name="sku" placeholder="SKU" value={edition.sku || ""} onChange={(event) => change(index, event)} /><input type="number" min="0" step="0.01" name="shippingWeight" placeholder="Weight kg" value={edition.shippingWeight} onChange={(event) => change(index, event)} /><button type="button" aria-label="Remove edition" onClick={() => removeEdition(index)}><Trash2 size={16} /></button></div>)}<button className="primary" type="submit" disabled={saving}><Save size={16} /> {saving ? "Saving..." : "Save editions"}</button>{message && <p className="inline-toast success" role="status">{message}</p>}</form></section>;
}
