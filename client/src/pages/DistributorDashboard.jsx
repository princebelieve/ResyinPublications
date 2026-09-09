import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import UserLayout from "../components/user/UserLayout";
import BankSelect from "../components/BankSelect";
import {
  createDistributorStockOrder,
  getDistributorCatalog,
  getDistributorDashboard,
  getNigerianBanks,
  recordDistributorSale,
  resolveNigerianAccount,
  updateDistributorSettings,
} from "../services/api";

const money = (value) => `₦${Number(value || 0).toLocaleString()}`;
const initialSettings = { bankName: "", bankCode: "", accountName: "", accountNumber: "", pickupAddress: "", pickupEnabled: true, deliveryEnabled: true };

export default function DistributorDashboard() {
  const [data, setData] = useState({ inventory: [], orders: [] });
  const [catalog, setCatalog] = useState([]);
  const [banks, setBanks] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [notice, setNotice] = useState("");
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [settings, setSettings] = useState(initialSettings);

  async function load() {
    try {
      const [dashboard, products, bankData] = await Promise.all([getDistributorDashboard(), getDistributorCatalog(), getNigerianBanks()]);
      setData(dashboard);
      setCatalog(products);
      setBanks(Array.isArray(bankData) ? bankData : bankData.banks || []);
      if (dashboard.settings) setSettings({ ...initialSettings, ...dashboard.settings });
    } catch (error) {
      setNotice(error.message || "Unable to load distributor information.");
    }
  }

  useEffect(() => { load(); }, []);

  const setQuantity = (id, value) => setQuantities((current) => ({ ...current, [id]: value }));

  function changeSettings(event) {
    const { name, value, checked, type } = event.target;
    if (name === "bankCode") {
      const bank = banks.find((item) => String(item.code) === value);
      setSettings((current) => ({ ...current, bankCode: value, bankName: bank?.name || "", accountName: "" }));
      return;
    }
    setSettings((current) => ({ ...current, [name]: type === "checkbox" ? checked : name === "accountNumber" ? value.replace(/\D/g, "").slice(0, 10) : value, ...(name === "accountNumber" ? { accountName: "" } : {}) }));
  }

  function chooseBank(bankCode) {
    const bank = banks.find((item) => String(item.code) === bankCode);
    setSettings((current) => ({ ...current, bankCode, bankName: bank?.name || "", accountName: "" }));
  }

  async function verifyAccount() {
    if (!settings.bankCode || settings.accountNumber.length !== 10) {
      setNotice("Select a bank and enter the 10-digit account number first.");
      return;
    }
    try {
      setResolvingAccount(true);
      setNotice("");
      const account = await resolveNigerianAccount(settings.bankCode, settings.accountNumber);
      setSettings((current) => ({ ...current, accountName: account.accountName, accountNumber: account.accountNumber }));
      setNotice("Account name verified. Review it, then save your settings.");
    } catch (error) {
      setNotice(error.message || "Account could not be verified.");
    } finally {
      setResolvingAccount(false);
    }
  }

  async function buy(product) {
    try {
      const response = await createDistributorStockOrder([{ productId: product._id, quantity: Number(quantities[product._id] || product.distributorMinimumQuantity || 1) }]);
      window.location.href = response.authorization_url;
    } catch (error) { setNotice(error.message || "Unable to start the stock purchase."); }
  }

  async function sell(item) {
    try {
      await recordDistributorSale(item.productId._id, Number(quantities[`sale-${item._id}`] || 1));
      setNotice("Sale recorded and your distributor stock was updated.");
      await load();
    } catch (error) { setNotice(error.message || "Unable to record this sale."); }
  }

  async function saveSettings(event) {
    event.preventDefault();
    try {
      await updateDistributorSettings(settings);
      setNotice("Payment and fulfilment settings saved.");
    } catch (error) { setNotice(error.message || "Unable to save distributor settings."); }
  }

  return <UserLayout><div className="page distributor-dashboard"><div className="distributor-heading"><div><p className="eyebrow">RESYIN DISTRIBUTOR</p><h1>Distributor dashboard</h1><p>Code: <strong>{data.distributorCode}</strong></p><p className="muted">Customer shop link: <strong>{`${window.location.origin}/d/${data.distributorCode}`}</strong></p></div><Link className="easy-btn easy-btn-primary" to="/collection">View retail shop</Link></div>{notice && <p className="inline-toast success">{notice}</p>}<section className="distributor-settings content-card"><h2>Customer payment & fulfilment</h2><p className="muted">Search for your bank and verify the account name. Transfer and pickup customers see these details at checkout.</p><form onSubmit={saveSettings} className="form"><BankSelect id="distributor-settings-bank" banks={banks} value={settings.bankCode} onChange={chooseBank} required /><input name="accountNumber" inputMode="numeric" maxLength="10" placeholder="10-digit account number" value={settings.accountNumber} onChange={changeSettings} required /><button type="button" className="secondary-button" onClick={verifyAccount} disabled={resolvingAccount || !settings.bankCode || settings.accountNumber.length !== 10}>{resolvingAccount ? "Verifying account…" : "Verify account name"}</button><input readOnly placeholder="Verified account name appears here" value={settings.accountName} /><textarea name="pickupAddress" placeholder="Pickup address" value={settings.pickupAddress} onChange={changeSettings} /><label className="wizard-checkbox"><input type="checkbox" name="pickupEnabled" checked={settings.pickupEnabled} onChange={changeSettings} /><span>Offer pickup</span></label><label className="wizard-checkbox"><input type="checkbox" name="deliveryEnabled" checked={settings.deliveryEnabled} onChange={changeSettings} /><span>Offer delivery</span></label><button className="primary" disabled={!settings.accountName}>Save customer settings</button></form></section><section><h2>Your stock</h2><div className="distributor-grid">{data.inventory.length ? data.inventory.map((item) => <article className="content-card distributor-card" key={item._id}><img src={item.productId.coverImage} alt="" /><h3>{item.productId.name}</h3><strong>{item.quantity} units available</strong><small>{item.unitsSold || 0} sold</small><div><input type="number" min="1" max={item.quantity} value={quantities[`sale-${item._id}`] || 1} onChange={(event) => setQuantity(`sale-${item._id}`, event.target.value)} /><button type="button" onClick={() => sell(item)} disabled={!item.quantity}>Record sale</button></div></article>) : <p>You have no distributor stock yet.</p>}</div></section><section><h2>Wholesale catalog</h2><div className="distributor-grid">{catalog.map((product) => <article className="content-card distributor-card" key={product._id}><img src={product.coverImage} alt="" /><h3>{product.name}</h3><p>Distributor price: <strong>{money(product.distributorPrice)}</strong></p><small>Retail price: {money(product.price)} · Minimum: {product.distributorMinimumQuantity}</small><div><input type="number" min={product.distributorMinimumQuantity} value={quantities[product._id] || product.distributorMinimumQuantity} onChange={(event) => setQuantity(product._id, event.target.value)} /><button type="button" onClick={() => buy(product)}>Buy stock</button></div></article>)}</div></section></div></UserLayout>;
}
