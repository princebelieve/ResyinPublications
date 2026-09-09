import { useEffect, useState } from "react";
import { getAdminDistributorInventory } from "../services/api";

export default function AdminDistributors() {
  const [data, setData] = useState({ inventory: [], orders: [] });
  const [error, setError] = useState("");
  useEffect(() => { getAdminDistributorInventory().then(setData).catch((err) => setError(err.message || "Unable to load distributor inventory.")); }, []);
  return <div className="page"><h1>Distributor inventory</h1><p className="muted">Monitor stock transferred to each approved distributor and their wholesale payments.</p>{error && <p className="error-message">{error}</p>}<div className="admin-card"><h2>Current distributor stock</h2>{data.inventory.length ? <div className="table-wrap"><table><thead><tr><th>Distributor</th><th>Product</th><th>Available</th><th>Sold</th></tr></thead><tbody>{data.inventory.map((item) => <tr key={item._id}><td>{item.distributorId.name}<br /><small>{item.distributorId.distributorCode}</small></td><td>{item.productId.name}</td><td>{item.quantity}</td><td>{item.unitsSold}</td></tr>)}</tbody></table></div> : <p>No distributor stock has been released yet.</p>}</div><div className="admin-card"><h2>Wholesale stock purchases</h2>{data.orders.length ? <div className="table-wrap"><table><thead><tr><th>Distributor</th><th>Amount</th><th>Payment</th><th>Date</th></tr></thead><tbody>{data.orders.map((order) => <tr key={order._id}><td>{order.distributorId.name}</td><td>₦{Number(order.totalAmount).toLocaleString()}</td><td>{order.paymentStatus}</td><td>{new Date(order.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p>No wholesale stock purchases yet.</p>}</div></div>;
}
