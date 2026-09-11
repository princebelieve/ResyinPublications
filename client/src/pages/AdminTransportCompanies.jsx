import { useEffect, useState } from "react";
import { createTransportCompany, deleteTransportCompany, getAdminTransportCompanies, getNigerianDeliveryStates, importStarterTransportCompanies, updateTransportCompany } from "../services/api";

const empty = { name: "", states: [], active: true };

export default function AdminTransportCompanies() {
  const [partners, setPartners] = useState([]);
  const [states, setStates] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const [items, rates] = await Promise.all([getAdminTransportCompanies(), getNigerianDeliveryStates()]);
      setPartners(items);
      setStates(rates.map((rate) => rate.state));
    } catch (error) {
      setMessage(error.message || "Unable to load delivery partners.");
    }
  }

  useEffect(() => { load(); }, []);

  function toggleState(state) {
    setForm((current) => ({
      ...current,
      states: current.states.includes(state) ? current.states.filter((item) => item !== state) : [...current.states, state],
    }));
  }

  async function save(event) {
    event.preventDefault();
    try {
      if (editing) await updateTransportCompany(editing, form);
      else await createTransportCompany(form);
      setForm(empty);
      setEditing(null);
      setMessage("Delivery partner saved.");
      load();
    } catch (error) {
      setMessage(error.message || "Unable to save delivery partner.");
    }
  }

  async function importStarter() {
    try {
      const result = await importStarterTransportCompanies();
      setMessage(result.message);
      load();
    } catch (error) {
      setMessage(error.message || "Unable to import delivery partners.");
    }
  }

  return (
    <div className="page">
      <h1>Delivery Partners</h1>
      <p className="muted">Add collection and delivery partners for customer orders. Assign each partner to the states they serve so customers can choose a collection point at checkout.</p>
      <button type="button" className="secondary-button" onClick={importStarter}>Import partners for all active states</button>
      <p className="muted">This imports common delivery partners and assigns them to every active delivery state. Review their coverage before customers place orders.</p>
      <form className="form" onSubmit={save}>
        <input required placeholder="Partner name or logistics company" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <fieldset className="payment-methods">
          <legend>States served</legend>
          <div className="wizard-grid">{states.map((state) => <label key={state} className="wizard-checkbox"><input type="checkbox" checked={form.states.includes(state)} onChange={() => toggleState(state)} /><span>{state}</span></label>)}</div>
        </fieldset>
        <label className="wizard-checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>Show at checkout</span></label>
        <button className="primary">{editing ? "Update delivery partner" : "Add delivery partner"}</button>
        {editing && <button type="button" onClick={() => { setForm(empty); setEditing(null); }}>Cancel</button>}
      </form>
      {message && <p className="inline-toast success">{message}</p>}
      <section style={{ marginTop: 32 }}>
        <h2>Configured delivery partners</h2>
        <div className="grid">{partners.map((partner) => <article className="card" key={partner._id}><h3>{partner.name}</h3><p>{partner.active ? "Active at checkout" : "Hidden from checkout"}</p><p className="muted">{partner.states.join(", ") || "All active delivery states"}</p><button onClick={() => { setEditing(partner._id); setForm({ name: partner.name, states: partner.states || [], active: partner.active }); }}>Edit</button><button className="btn-danger" onClick={async () => { await deleteTransportCompany(partner._id); load(); }}>Delete</button></article>)}</div>
      </section>
    </div>
  );
}
