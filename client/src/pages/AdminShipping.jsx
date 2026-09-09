import { useEffect, useRef, useState } from "react";
import {
  createNigerianStateShipping,
  createShippingZone,
  deleteNigerianStateShipping,
  deleteShippingZone,
  getNigerianStateShipping,
  getShippingSettings,
  getShippingZones,
  updateNigerianStateShipping,
  updateShippingSettings,
  updateShippingZone,
} from "../services/api";
import useAuth from "../context/AuthContext";

const blank = {
  state: "", baseDeliveryFee: 0, serviceName: "Standard Delivery",
  handlingTimeMinDays: 1, handlingTimeMaxDays: 2, transitTimeMinDays: 2,
  transitTimeMaxDays: 7, estimatedDays: "3-9 business days",
  dutiesAndTaxes: "customer", active: true,
};

const stateRateBlank = {
  state: "",
  baseDeliveryFee: 0,
  serviceName: "State delivery",
  estimatedDays: "2-5 business days",
  active: true,
};

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
];

export default function AdminShipping() {
  const { token } = useAuth();
  const [zones, setZones] = useState([]);
  const [stateRates, setStateRates] = useState([]);
  const [form, setForm] = useState(blank);
  const [stateRateForm, setStateRateForm] = useState(stateRateBlank);
  const [defaults, setDefaults] = useState({ defaultShippingPrice: 0, defaultDeliveryEstimate: "3-7 business days" });
  const [editing, setEditing] = useState(null);
  const [editingStateRate, setEditingStateRate] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [message, setMessage] = useState("");
  const stateRateFormRef = useRef(null);
  const countryFormRef = useRef(null);

  function scrollToForm(ref) {
    window.requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  const load = async () => {
    try {
      const [loadedZones, loadedSettings, loadedStateRates] = await Promise.all([getShippingZones(token), getShippingSettings(token), getNigerianStateShipping(token)]);
      setZones(loadedZones);
      setStateRates(loadedStateRates);
      setDefaults({ defaultShippingPrice: loadedSettings.defaultShippingPrice ?? 0, defaultDeliveryEstimate: loadedSettings.defaultDeliveryEstimate ?? "3-7 business days" });
    } catch {
      setMessage("Unable to load shipping settings.");
    }
  };

  useEffect(() => { if (token) load(); }, [token]);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const changeStateRate = (event) => {
    const { name, value, type, checked } = event.target;
    setStateRateForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  async function saveDefaults(event) {
    event.preventDefault();
    setMessage("");
    try {
      const saved = await updateShippingSettings({ defaultShippingPrice: Number(defaults.defaultShippingPrice), defaultDeliveryEstimate: defaults.defaultDeliveryEstimate }, token);
      setDefaults({ defaultShippingPrice: saved.defaultShippingPrice, defaultDeliveryEstimate: saved.defaultDeliveryEstimate });
      setMessage("Default shipping settings saved.");
    } catch (error) {
      setMessage(error.message || "Default shipping settings could not be saved.");
    }
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const payload = {
        ...form, state: form.state.toUpperCase(), currency: "NGN",
        baseDeliveryFee: Number(form.baseDeliveryFee),
        handlingTimeMinDays: Number(form.handlingTimeMinDays), handlingTimeMaxDays: Number(form.handlingTimeMaxDays),
        transitTimeMinDays: Number(form.transitTimeMinDays), transitTimeMaxDays: Number(form.transitTimeMaxDays),
        cities: [], categoryPricing: [],
      };
      if (editing) await updateShippingZone(editing, payload, token);
      else await createShippingZone(payload, token);
      setForm(blank); setEditing(null); setMessage("Shipping policy saved."); load();
    } catch (error) {
      setMessage(error.message || "Shipping policy could not be saved.");
    }
  }

  async function saveStateRate(event) {
    event.preventDefault();
    setMessage("");
    try {
      const payload = {
        ...stateRateForm,
        baseDeliveryFee: Number(stateRateForm.baseDeliveryFee),
      };
      if (editingStateRate) await updateNigerianStateShipping(editingStateRate, payload, token);
      else await createNigerianStateShipping(payload, token);
      setStateRateForm(stateRateBlank);
      setEditingStateRate(null);
      setMessage("Nigerian state delivery rate saved.");
      load();
    } catch (error) {
      setMessage(error.message || "State delivery rate could not be saved.");
    }
  }

  return <div className="page">
    <h1>Shipping Policies</h1>
    <p className="muted">For Nigeria, set one delivery price per state below. Checkout charges only that selected state price—no other shipping fee is added.</p>

    {showAdvanced && <form className="form" onSubmit={saveDefaults}>
      <h2>Backup price for unconfigured locations</h2>
      <p className="muted">Optional, for countries outside Nigeria only. Nigerian orders never use this price.</p>
      <div className="wizard-grid">
        <input required type="number" min="0" name="defaultShippingPrice" placeholder="Backup delivery price (NGN)" value={defaults.defaultShippingPrice} onChange={(event) => setDefaults((current) => ({ ...current, defaultShippingPrice: event.target.value }))} />
        <input required name="defaultDeliveryEstimate" placeholder="Backup delivery estimate" value={defaults.defaultDeliveryEstimate} onChange={(event) => setDefaults((current) => ({ ...current, defaultDeliveryEstimate: event.target.value }))} />
      </div>
      <button type="submit">Save backup price</button>
    </form>}

    <form ref={stateRateFormRef} className="form" onSubmit={saveStateRate} style={{ marginTop: 32 }}>
      <h2>Nigeria state delivery rates</h2>
      <p className="muted">This is the main setup. Set the one delivery price customers pay when they select each Nigerian state.</p>
      <div className="wizard-grid">
        <select required name="state" value={stateRateForm.state} onChange={changeStateRate}>
          <option value="">Select a state</option>
          {NIGERIAN_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
        </select>
        <input required type="number" min="0" name="baseDeliveryFee" placeholder="State delivery price (NGN)" value={stateRateForm.baseDeliveryFee} onChange={changeStateRate} />
        <input required name="serviceName" placeholder="Service name" value={stateRateForm.serviceName} onChange={changeStateRate} />
        <input required name="estimatedDays" placeholder="Delivery estimate" value={stateRateForm.estimatedDays} onChange={changeStateRate} />
      </div>
      <label><input type="checkbox" name="active" checked={stateRateForm.active} onChange={changeStateRate} /> Active</label>
      <button type="submit">{editingStateRate ? "Update state rate" : "Add state rate"}</button>
      {editingStateRate && <button type="button" onClick={() => { setStateRateForm(stateRateBlank); setEditingStateRate(null); }}>Cancel</button>}
    </form>

    <button type="button" className="secondary-button" style={{ marginTop: 20 }} onClick={() => setShowAdvanced((current) => !current)} aria-expanded={showAdvanced}>
      {showAdvanced ? "Hide optional backup settings" : "Optional backup or international settings"}
    </button>

    {showAdvanced && <form ref={countryFormRef} className="form" onSubmit={submit} style={{ marginTop: 20 }}>
      <h2>Country backup prices</h2>
      <p className="muted">Optional, for countries outside Nigeria only. Do not enter NG here—Nigerian delivery must use the state price above.</p>
      <div className="wizard-grid">
        <input required name="state" maxLength="2" placeholder="Country code, e.g. GH or GB (not NG)" value={form.state} onChange={change} />
        <input required type="number" min="0" name="baseDeliveryFee" placeholder="Country backup price (NGN)" value={form.baseDeliveryFee} onChange={change} />
        <input required name="serviceName" placeholder="Service name" value={form.serviceName} onChange={change} />
      </div>
      <div className="wizard-grid">
        <input type="number" min="0" name="handlingTimeMinDays" placeholder="Min handling days" value={form.handlingTimeMinDays} onChange={change} />
        <input type="number" min="0" name="handlingTimeMaxDays" placeholder="Max handling days" value={form.handlingTimeMaxDays} onChange={change} />
        <input type="number" min="0" name="transitTimeMinDays" placeholder="Min transit days" value={form.transitTimeMinDays} onChange={change} />
        <input type="number" min="0" name="transitTimeMaxDays" placeholder="Max transit days" value={form.transitTimeMaxDays} onChange={change} />
      </div>
      <input name="estimatedDays" placeholder="Customer-facing delivery estimate" value={form.estimatedDays} onChange={change} />
      <select name="dutiesAndTaxes" value={form.dutiesAndTaxes} onChange={change}><option value="customer">Customer pays import duties/taxes</option><option value="included">Duties/taxes included</option></select>
      <label><input type="checkbox" name="active" checked={form.active} onChange={change} /> Active</label>
      <button type="submit">{editing ? "Update policy" : "Add policy"}</button>
      {editing && <button type="button" onClick={() => { setForm(blank); setEditing(null); }}>Cancel</button>}
    </form>}

    {message && <p>{message}</p>}
    <section style={{ marginTop: 32 }}>
      <h2>Configured Nigeria state rates</h2>
      {stateRates.length === 0 ? <p className="muted">No state rates yet. Add the states you currently deliver to above.</p> : (
        <div className="grid">{stateRates.map((rate) => <article className="card" key={rate._id}>
          <h3>{rate.state}</h3>
          <p>₦{Number(rate.baseDeliveryFee).toLocaleString()}</p>
          <p>{rate.serviceName} · {rate.estimatedDays}</p>
          <p>{rate.active ? "Active at checkout" : "Inactive"}</p>
          <button onClick={() => { const state = NIGERIAN_STATES.find((option) => option.toUpperCase() === rate.state) || rate.state; setEditingStateRate(rate._id); setStateRateForm({ ...stateRateBlank, ...rate, state }); scrollToForm(stateRateFormRef); }}>Edit</button>
          <button className="btn-danger" onClick={async () => { try { await deleteNigerianStateShipping(rate._id, token); setMessage("State delivery rate deleted."); load(); } catch (error) { setMessage(error.message || "State delivery rate could not be deleted."); } }}>Delete</button>
        </article>)}</div>
      )}
    </section>
    <div className="grid" style={{ marginTop: 32 }}>{zones.map((zone) => <article className="card" key={zone._id}>
      <h3>{zone.state} · {zone.serviceName}</h3>
      <p>₦{Number(zone.baseDeliveryFee).toLocaleString()}</p>
      <p>{zone.handlingTimeMinDays}-{zone.handlingTimeMaxDays} handling days · {zone.transitTimeMinDays}-{zone.transitTimeMaxDays} transit days</p>
      <p>{zone.dutiesAndTaxes === "included" ? "Duties/taxes included" : "Customer pays import duties/taxes"}</p>
      <button onClick={() => { setShowAdvanced(true); setEditing(zone._id); setForm({ ...blank, ...zone }); window.setTimeout(() => scrollToForm(countryFormRef), 0); }}>Edit</button>
      <button className="btn-danger" onClick={async () => { await deleteShippingZone(zone._id, token); load(); }}>Delete</button>
    </article>)}</div>
  </div>;
}
