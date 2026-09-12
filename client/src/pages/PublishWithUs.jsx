import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BankSelect from "../components/BankSelect";
import BookUploadForm from "../components/BookUploadForm";
import RequireAuth from "../components/RequireAuth";
import useAuth from "../context/AuthContext";
import { applyAsPublisher, getNigerianBanks, getPublicPublisherSubscriptionSettings, renewPublisherSubscription, submitPublisherBook, updatePublisherPaymentAccount } from "../services/api";

function PublisherBankSetup() {
  const { token, user, setUser } = useAuth();
  const [banks, setBanks] = useState([]);
  const [bankForm, setBankForm] = useState({
    bankCode: user?.publisherBankCode || "",
    bankName: user?.publisherBankName || "",
    accountNumber: user?.publisherAccountNumber || "",
    accountName: user?.publisherAccountName || "",
    paymentInstructions: user?.publisherPaymentInstructions || "",
  });
  const [busy, setBusy] = useState(false);
  const [manualVerified, setManualVerified] = useState(Boolean(user?.publisherAccountName && user?.publisherAccountNumber));
  const [message, setMessage] = useState("");

  useEffect(() => {
    getNigerianBanks().then(setBanks).catch(() => setBanks([]));
  }, []);

  function changeBank(event) {
    const { name, value } = event.target;
    setBankForm((current) => ({
      ...current,
      [name]: name === "accountNumber" ? value.replace(/\D/g, "").slice(0, 10) : value,
      ...(name === "accountNumber" ? { accountName: "" } : {}),
    }));
  }

  function chooseBank(bankCode) {
    const bank = banks.find((item) => String(item.code) === String(bankCode));
    setBankForm((current) => ({
      ...current,
      bankCode,
      bankName: bank?.name || "",
      accountName: "",
    }));
  }

  function verifyAccountManually() {
    if (!bankForm.bankCode || bankForm.accountNumber.length !== 10) {
      setMessage("Select a bank and enter a valid 10-digit account number before verification.");
      return;
    }

    setManualVerified(true);
    setMessage("Account details passed local verification. You may now save the direct payment account.");
  }

  async function savePaymentAccount() {
    if (!bankForm.bankCode || bankForm.accountNumber.length !== 10 || !manualVerified) {
      setMessage("Select a valid bank, enter the 10-digit account number, and click Verify account before saving.");
      return;
    }

    if (!bankForm.accountName) {
      setBankForm((current) => ({ ...current, accountName: user?.publisherAccountName || "" }));
      setMessage("The account name is kept from the verified direct-payment record. If it is blank, complete the verification step again in the admin panel.");
      return;
    }

    try {
      setBusy(true);
      setMessage("");
      const result = await updatePublisherPaymentAccount({
        bankName: bankForm.bankName,
        bankCode: bankForm.bankCode,
        accountNumber: bankForm.accountNumber,
        accountName: bankForm.accountName,
        paymentInstructions: bankForm.paymentInstructions,
      }, token);

      const updated = {
        ...user,
        publisherBankName: result.account.bankName,
        publisherBankCode: result.account.bankCode,
        publisherAccountName: result.account.accountName,
        publisherAccountNumber: result.account.accountNumber,
        publisherPaymentInstructions: result.account.paymentInstructions,
      };

      setUser(updated);
      setMessage(result.message || "Direct payment account saved.");
    } catch (error) {
      setMessage(error.message || "Unable to save direct payment account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="content-card publisher-onboarding">
      <h2>Direct payment account</h2>
      <p className="muted">Bank name is selected from the verified list and account name is locked after verification to prevent mistakes.</p>
      <div className="form">
        <BankSelect id="publisher-bank" banks={banks} value={bankForm.bankCode} onChange={chooseBank} required />
        <input name="accountNumber" placeholder="10-digit account number" value={bankForm.accountNumber} onChange={changeBank} inputMode="numeric" maxLength={10} />
        <input
          name="accountName"
          placeholder="Account holder name"
          value={bankForm.accountName}
          onChange={changeBank}
          readOnly={Boolean(bankForm.accountName || user?.publisherAccountName)}
          aria-readonly={Boolean(bankForm.accountName || user?.publisherAccountName)}
        />
        <textarea
          name="paymentInstructions"
          rows="3"
          placeholder="Optional note to buyer, e.g. transfer reference instructions"
          value={bankForm.paymentInstructions}
          onChange={changeBank}
        />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="secondary" type="button" onClick={verifyAccountManually} disabled={busy}>Verify account</button>
          <button className="primary" type="button" onClick={savePaymentAccount} disabled={busy}>Save direct payment account</button>
        </div>
        {message && <p className="inline-toast success">{message}</p>}
      </div>
    </section>
  );
}

function PublisherSubmissionForm() {
  const { token, user, setUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({
    publisherName: user?.publisherName || "",
    publisherType: user?.publisherType || "author",
    website: user?.publisherWebsite || "",
    bio: user?.publisherBio || "",
    note: user?.publisherApplicationNote || "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPublicPublisherSubscriptionSettings().then(setSettings).catch(() => setSettings({ enabled: false }));
  }, []);

  function change(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function apply() {
    setSaving(true);
    setMessage("");
    try {
      const result = await applyAsPublisher(
        {
          publisherName: form.publisherName,
          publisherType: form.publisherType,
          website: form.website,
          bio: form.bio,
          note: form.note,
        },
        token,
      );

      const updated = {
        ...user,
        publisherStatus: "pending",
        publisherName: form.publisherName,
        publisherType: form.publisherType,
        publisherWebsite: form.website,
        publisherBio: form.bio,
        publisherApplicationNote: form.note,
      };

      setUser(updated);
      if (result.authorization_url) {
        window.location.assign(result.authorization_url);
        return;
      }
      setMessage(result.message);
    } catch (error) {
      setMessage(error.message || "Unable to submit publisher application.");
    } finally {
      setSaving(false);
    }
  }

  async function submit(formData) {
    await submitPublisherBook(formData, token);
    window.alert("Your book has been submitted for RESYIN review.");
    window.location.href = "/publish-with-us";
  }

  async function renewSubscription() {
    try {
      setSaving(true);
      const result = await renewPublisherSubscription(token);
      window.location.assign(result.authorization_url);
    } catch (error) {
      setMessage(error.message || "Unable to start subscription renewal.");
    } finally {
      setSaving(false);
    }
  }

  if (user?.publisherStatus === "pending") {
    return (
      <section className="content-card publisher-onboarding">
        <h2>Publisher application pending</h2>
        <p>
          Your publisher profile has been submitted for review. RESYIN will approve the platform subscription before you can upload books for listing.
        </p>
        <div className="form">
          <p><strong>Publisher name:</strong> {user?.publisherName || form.publisherName || "Not set"}</p>
          <p><strong>Publisher type:</strong> {user?.publisherType || form.publisherType}</p>
          {user?.publisherApplicationNote && <p><strong>Application note:</strong> {user.publisherApplicationNote}</p>}
        </div>
      </section>
    );
  }

  if (user?.publisherStatus === "approved") {
    const expired = !user.publisherSubscriptionExpiresAt || new Date(user.publisherSubscriptionExpiresAt) <= new Date();
    if (expired) return <section className="content-card publisher-onboarding"><h2>Renew your publisher subscription</h2><p>Your subscription has expired. Renew it securely with Paystack to continue submitting books.</p><button type="button" className="primary" onClick={renewSubscription} disabled={saving}>{saving ? "Opening secure payment..." : "Renew subscription"}</button>{message && <p className="inline-toast error">{message}</p>}</section>;
    return (
      <>
        <PublisherBankSetup />
        <BookUploadForm onSubmit={submit} />
      </>
    );
  }

  return (
    <section className="content-card publisher-onboarding">
      <h2>Apply to become a publisher</h2>

      {!settings?.enabled ? (
        <p>Publisher submissions are currently closed by RESYIN administration.</p>
      ) : (
        <>
          <p>
            Authors and publishers subscribe to the RESYIN platform. Buyers pay the author or publisher directly for each book purchase. RESYIN does not pay authors on your behalf.
          </p>

          {settings.annualFee > 0 && (
            <p>
              <strong>Annual platform subscription:</strong> {settings.currency} {Number(settings.annualFee).toLocaleString()}
            </p>
          )}

          {settings.authorTerms && <p className="muted">{settings.authorTerms}</p>}

          <div className="form">
            <input
              name="publisherName"
              placeholder="Author or publishing name"
              value={form.publisherName}
              onChange={change}
            />

            <select name="publisherType" value={form.publisherType} onChange={change}>
              <option value="author">Author</option>
              <option value="independent-publisher">Independent publisher</option>
              <option value="imprint">Imprint</option>
              <option value="company">Company / organisation</option>
            </select>

            <input
              name="website"
              placeholder="Website or portfolio (optional)"
              value={form.website}
              onChange={change}
            />

            <textarea
              name="bio"
              placeholder="Brief profile or publishing background (optional)"
              value={form.bio}
              onChange={change}
            />

            <textarea
              name="note"
              placeholder="Tell RESYIN about the books you want to publish"
              value={form.note}
              onChange={change}
            />

            <button
              className="primary"
              type="button"
              onClick={apply}
              disabled={saving || !form.publisherName || !form.publisherType}
            >
              {saving ? "Submitting..." : "Submit publisher application"}
            </button>

            {message && <p className="inline-toast success">{message}</p>}
          </div>
        </>
      )}
    </section>
  );
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
            <p className="muted">
              Submit your book for review and make it available to readers as a paperback, hardcover, PDF, or EPUB edition.
            </p>
          </div>
          <Link to="/collection">Browse books</Link>
        </div>
        <RequireAuth><PublisherSubmissionForm /></RequireAuth>
      </main>
      <Footer />
    </>
  );
}
