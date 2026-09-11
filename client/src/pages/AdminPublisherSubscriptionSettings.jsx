import { useEffect, useState } from "react";
import useAuth from "../context/AuthContext";
import { getPublisherSubscriptionSettings, updatePublisherSubscriptionSettings } from "../services/api";

const initialSettings = {
  enabled: false,
  annualFee: 0,
  currency: "NGN",
  subscriptionDays: 365,
  gracePeriodDays: 14,
  autoRenewEnabled: false,
  requireAdminApproval: true,
  authorTerms: "",
};

export default function AdminPublisherSubscriptionSettings() {
  const { token } = useAuth();
  const [settings, setSettings] = useState(initialSettings);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getPublisherSubscriptionSettings(token)
      .then((data) => setSettings({ ...initialSettings, ...data }))
      .catch((error) => setMessage(error.message || "Unable to load subscription settings."));
  }, [token]);

  function change(event) {
    const { name, value, checked, type } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : ["annualFee", "subscriptionDays", "gracePeriodDays"].includes(name) ? Number(value) : value,
    }));
  }

  async function save(event) {
    event.preventDefault();
    setMessage("");
    try {
      await updatePublisherSubscriptionSettings(settings, token);
      setMessage("Publisher subscription settings saved.");
    } catch (error) {
      setMessage(error.message || "Unable to save subscription settings.");
    }
  }

  return (
    <div className="page">
      <h1>Publisher Submission Settings</h1>
      <p className="muted">Control how external authors and publishers submit books for review and listing on RESYIN.</p>
      <form className="form" onSubmit={save}>
        <label className="wizard-checkbox"><input type="checkbox" name="enabled" checked={settings.enabled} onChange={change} /><span>Enable publisher submissions</span></label>
        <label>Publisher listing fee<input required={settings.enabled} type="number" min="0" name="annualFee" value={settings.annualFee} onChange={change} /></label>
        <label>Currency<input name="currency" value={settings.currency} onChange={change} maxLength="3" /></label>
        <label>Listing period in days<input type="number" min="1" name="subscriptionDays" value={settings.subscriptionDays} onChange={change} /></label>
        <label>Grace period in days<input type="number" min="0" name="gracePeriodDays" value={settings.gracePeriodDays} onChange={change} /></label>
        <label className="wizard-checkbox"><input type="checkbox" name="requireAdminApproval" checked={settings.requireAdminApproval} onChange={change} /><span>Require admin approval before an author is listed</span></label>
        <label className="wizard-checkbox"><input type="checkbox" name="autoRenewEnabled" checked={settings.autoRenewEnabled} onChange={change} /><span>Allow auto-renewal policy later</span></label>
        <label>Publisher terms<textarea name="authorTerms" rows="7" value={settings.authorTerms} onChange={change} placeholder="Terms shown to authors and publishers before submitting a book" /></label>
        <button className="primary" type="submit">Save subscription settings</button>
        {message && <p className="inline-toast success" role="status">{message}</p>}
      </form>
    </div>
  );
}
