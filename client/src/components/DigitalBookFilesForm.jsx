import { useState } from "react";
import { FileText, Upload } from "lucide-react";
import { updateProductApi } from "../services/api";
import { getToken } from "../utils/auth";

export default function DigitalBookFilesForm({ product, onSaved }) {
  const [pdfFile, setPdfFile] = useState(null);
  const [epubFile, setEpubFile] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!pdfFile && !epubFile) {
      setStatus("Choose a PDF or EPUB file first.");
      return;
    }

    const data = new FormData();
    if (pdfFile) data.append("pdfFile", pdfFile);
    if (epubFile) data.append("epubFile", epubFile);

    try {
      setSaving(true);
      setStatus("");
      const saved = await updateProductApi(product._id, data, getToken());
      setPdfFile(null);
      setEpubFile(null);
      setStatus("Digital files uploaded to private R2 storage.");
      onSaved?.(saved);
    } catch (error) {
      setStatus(error.message || "Digital files could not be uploaded.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="digital-book-files-panel">
      <div className="digital-book-files-heading">
        <div>
          <span className="eyebrow">PRIVATE DIGITAL DELIVERY</span>
          <h2>Digital book files</h2>
          <p>Upload the PDF and/or EPUB files for the digital formats above. Buyers receive access only after a paid order is confirmed.</p>
        </div>
        <FileText size={30} aria-hidden="true" />
      </div>
      <form onSubmit={submit} className="digital-book-files-form">
        <label>
          PDF file
          <input type="file" accept="application/pdf,.pdf" onChange={(event) => setPdfFile(event.target.files?.[0] || null)} />
          {pdfFile && <small>{pdfFile.name}</small>}
        </label>
        <label>
          EPUB file
          <input type="file" accept="application/epub+zip,.epub" onChange={(event) => setEpubFile(event.target.files?.[0] || null)} />
          {epubFile && <small>{epubFile.name}</small>}
        </label>
        <button type="submit" disabled={saving}><Upload size={16} /> {saving ? "Uploading..." : "Upload PDF/EPUB files"}</button>
        {status && <p role="status">{status}</p>}
      </form>
    </section>
  );
}
