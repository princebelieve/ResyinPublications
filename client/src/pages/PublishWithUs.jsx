import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BookUploadForm from "../components/BookUploadForm";
import RequireAuth from "../components/RequireAuth";
import useAuth from "../context/AuthContext";
import BankSelect from "../components/BankSelect";
import { applyAsPublisher, getNigerianBanks, getPublicPublisherSubscriptionSettings, getPublicStorePaymentSettings, submitPublisherBook } from "../services/api";

function PublisherSubmissionForm({ user, refreshUser }) {
  const { token, setUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [storePayment, setStorePayment] = useState(null);
  const [banks, setBanks] = useState([]);
  const [form, setForm] = useState({ bankName: "", bankCode: "", accountNumber: "", note: "" });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPublicPublisherSubscriptionSettings().then(setSettings).catch(() => setSettings({ enabled: false }));
    getPublicStorePaymentSettings().then(setStorePayment).catch(() => setStorePayment(null));
    getNigerianBanks().then((data) => setBanks(Array.isArray(data) ? data : data.banks || [])).catch(() => setBanks([]));
  }, []);

  function change(event) {
    const { name, value } = event.target;
    if (name === "bankCode") {
      const bank = banks.find((item) => String(item.code) === value);
      setForm((current) => ({ ...current, bankCode: value, bankName: bank?.name || "" }));
      return;
    }
    setForm((current) => ({ ...current, [name]: name === "accountNumber" ? value.replace(/\D/g, "").slice(0, 10) : value }));
  }

  async function apply() {
    setSaving(true);
    setMessage("");
    try {
      const result = await applyAsPublisher(form, token);
      const updated = { ...user, publisherStatus: "pending", publisherBankName: form.bankName, publisherAccountNumber: form.accountNumber, publisherApplicationNote: form.note };
      setUser(updated);
      refreshUser?.(updated);
      setMessage(result.message);
    } catch (error) { setMessage(error.message || "Unable to submit publisher application."); }
    finally { setSaving(false); }
  }

  async function submit(formData) {
    await submitPublisherBook(formData, token);
    window.alert("Your book has been submitted for RESYIN review.");
    window.location.href = "/dashboard";
  }

  if (user?.publisherStatus !== "approved") return <section className="content-card publisher-onboarding">
    <h2>Join as a publisher</h2>
    {!settings?.enabled ? <p>Publisher submissions are currently closed by RESYIN administration.</p> : <>
      <p>Pay the annual platform subscription to RESYIN, then submit your verified payment details below. An administrator will approve your publisher account after confirming the subscription.</p>
      {settings.annualFee > 0 && <p><strong>Annual platform subscription:</strong> {settings.currency} {Number(settings.annualFee).toLocaleString()}</p>}
      {storePayment?.manualTransferEnabled && <p><strong>Pay RESYIN directly:</strong> {storePayment.accountName} · {storePayment.accountNumber} · {storePayment.bankName}</p>}
      {settings.authorTerms && <p className="muted">{settings.authorTerms}</p>}
      <div className="form"><BankSelect id="publisher-bank" banks={banks} value={form.bankCode} onChange={(bankCode) => change({ target: { name: "bankCode", value: bankCode } })} required /><input name="accountNumber" inputMode="numeric" placeholder="Your 10-digit author payment account" value={form.accountNumber} onChange={change} /><textarea name="note" placeholder="Tell RESYIN about your books or publishing work" value={form.note} onChange={change} /><button className="primary" type="button" onClick={apply} disabled={saving || form.accountNumber.length !== 10}>{saving ? "Submitting..." : "Submit publisher application"}</button>{message && <p className="inline-toast success">{message}</p>}</div>
    </>}
  </section>;
  return <BookUploadForm onSubmit={submit} />;
}

export default function PublishWithUs() {
  return (
    <>
      <Navbar />
      <main className="page publish-with-us-page">
        <div className="page-header">
          <div>
            <span className="eyebrow">AUTHORS &amp; PUBLISHERS</span>
            <h1>Publish with RESYIN</h1>
            <p className="muted">Submit your book for review and make it available to readers as a paperback, hardcover, PDF, or EPUB edition.</p>
          </div>
          <Link to="/collection">Browse books</Link>
        </div>
        <RequireAuth><PublisherSubmissionForm /></RequireAuth>
      </main>
      <Footer />
    </>
  );
}
