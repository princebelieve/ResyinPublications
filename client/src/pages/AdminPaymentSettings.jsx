import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/AuthContext";
import { getNigerianBanks, getStorePaymentSettings, resolveNigerianAccount, updateStorePaymentSettings } from "../services/api";
import BankSelect from "../components/BankSelect";

const initialSettings = { manualTransferEnabled: false, bankName: "", bankCode: "", accountName: "", accountNumber: "", transferInstructions: "" };

export default function AdminPaymentSettings() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(initialSettings);
  const [banks, setBanks] = useState([]);
  const [message, setMessage] = useState("");
  const [resolving, setResolving] = useState(false);
  useEffect(() => { getStorePaymentSettings(token).then((data) => setSettings({ ...initialSettings, ...data })).catch((error) => setMessage(error.message || "Unable to load payment settings.")); getNigerianBanks().then(setBanks).catch((error) => setMessage(error.message || "Unable to load Nigerian banks.")); }, [token]);
  const change = (event) => { const { name, value, checked, type } = event.target; if (name === "bankCode") { const bank = banks.find((item) => item.code === value); setSettings((current) => ({ ...current, bankCode: value, bankName: bank?.name || "", accountName: "" })); return; } setSettings((current) => ({ ...current, [name]: type === "checkbox" ? checked : name === "accountNumber" ? value.replace(/\D/g, "").slice(0, 10) : value, ...(name === "accountNumber" ? { accountName: "" } : {}) })); };
  const chooseBank = (bankCode) => { const bank = banks.find((item) => String(item.code) === bankCode); setSettings((current) => ({ ...current, bankCode, bankName: bank?.name || "", accountName: "" })); };
  async function resolveAccount() { setMessage(""); try { setResolving(true); const account = await resolveNigerianAccount(settings.bankCode, settings.accountNumber); setSettings((current) => ({ ...current, accountName: account.accountName, accountNumber: account.accountNumber })); setMessage("Account name verified. Review it, then save."); } catch (error) { setMessage(error.message || "Account could not be verified."); } finally { setResolving(false); } }
  async function save(event) { event.preventDefault(); setMessage(""); try { await updateStorePaymentSettings(settings, token); navigate("/admin"); } catch (error) { setMessage(error.message || "Unable to save payment settings."); } }
  return <div className="page"><h1>Bookstore Payment Settings</h1><p className="muted">Add your Nigerian bank account for customer orders. RESYIN verifies the account name before saving; all transfers go directly to your bank.</p><form className="form" onSubmit={save}><label className="wizard-checkbox"><input type="checkbox" name="manualTransferEnabled" checked={settings.manualTransferEnabled} onChange={change} /><span>Accept bank transfers at checkout</span></label><BankSelect id="resyin-bank" banks={banks} value={settings.bankCode} onChange={chooseBank} required={settings.manualTransferEnabled} /><input required={settings.manualTransferEnabled} inputMode="numeric" name="accountNumber" placeholder="10-digit account number" value={settings.accountNumber} onChange={change} /><button type="button" className="secondary-button" onClick={resolveAccount} disabled={resolving || !settings.bankCode || settings.accountNumber.length !== 10}>{resolving ? "Verifying account…" : "Verify account name"}</button><input readOnly name="accountName" placeholder="Verified account name appears here" value={settings.accountName} /><textarea name="transferInstructions" rows="4" placeholder="Optional instructions, e.g. use order number as transfer narration" value={settings.transferInstructions} onChange={change} /><button className="primary" type="submit" disabled={settings.manualTransferEnabled && !settings.accountName}>Save payment settings</button>{message && <p className="inline-toast success">{message}</p>}</form></div>;
}
