//client/src/pages/AdminSales.jsx
import { useEffect, useState } from "react";
import {
  getAdminOrders,
  getAdminArchivedOrders,
  archiveOrderApi,
  archiveAllOrders,
} from "../services/api";
import { getToken } from "../utils/auth";
import { formatDate } from "../utils/formatDate";

export default function AdminSales() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshTime, setRefreshTime] = useState(null);
  const [archivingOrderId, setArchivingOrderId] = useState(null);
  const [archivedOrders, setArchivedOrders] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState({
    startDate: "",
    endDate: "",
  });
  const [error, setError] = useState("");

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminOrders(getToken());
      setOrders(data || []);
      setRefreshTime(new Date());
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function loadArchivedOrders(filters = {}) {
    try {
      const data = await getAdminArchivedOrders(getToken(), filters);
      setArchivedOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to load archived orders.");
    }
  }

  async function handleResetActiveSales() {
    setLoading(true);
    setError("");

    try {
      await archiveAllOrders(getToken());
      await loadOrders();
      await loadArchivedOrders();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to reset active sales.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchArchived() {
    await loadArchivedOrders({
      startDate: archiveFilter.startDate,
      endDate: archiveFilter.endDate,
    });
  }

  async function handleClearArchiveFilter() {
    setArchiveFilter({
      startDate: "",
      endDate: "",
    });
    await loadArchivedOrders();
  }

  useEffect(() => {
    loadOrders();
    loadArchivedOrders();
  }, []);

  const activeOrders = Array.isArray(orders) ? orders : [];
  const archivedOrdersArray = Array.isArray(archivedOrders)
    ? archivedOrders
    : [];

  const isPaidOrder = (order) => order?.paymentStatus === "paid";
  const paidActiveOrders = activeOrders.filter(isPaidOrder);
  const paidArchivedOrders = archivedOrdersArray.filter(isPaidOrder);

  const totalSales = paidActiveOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0,
  );

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 6);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dailySales = paidActiveOrders.reduce((sum, order) => {
    const created = new Date(order.createdAt);
    return created >= startOfDay ? sum + Number(order.totalAmount || 0) : sum;
  }, 0);

  const weeklySales = paidActiveOrders.reduce((sum, order) => {
    const created = new Date(order.createdAt);
    return created >= startOfWeek ? sum + Number(order.totalAmount || 0) : sum;
  }, 0);

  const monthlySales = paidActiveOrders.reduce((sum, order) => {
    const created = new Date(order.createdAt);
    return created >= startOfMonth ? sum + Number(order.totalAmount || 0) : sum;
  }, 0);

  const archivedTotal = paidArchivedOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0,
  );

  async function handleArchive(orderId) {
    setArchivingOrderId(orderId);
    setError("");

    try {
      await archiveOrderApi(orderId, getToken());
      await loadOrders();
      await loadArchivedOrders();
    } catch (err) {
      console.error(err);
      setError(err.message || "Unable to archive order.");
    } finally {
      setArchivingOrderId(null);
    }
  }

  return (
    <div className="page">
      <div className="admin-sales-header">
        <div>
          <h1>Sales Report</h1>
          {refreshTime && (
            <p className="muted">
              Last reset:{" "}
              {formatDate(refreshTime, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          )}
        </div>

        <div className="admin-sales-actions">
          <button
            type="button"
            onClick={handleResetActiveSales}
            disabled={loading}
          >
            {loading ? "Resetting…" : "Reset active sales"}
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowArchived((prev) => !prev)}
          >
            {showArchived ? "Hide archived" : "Show archived"}
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-low-stock" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}

      <div className="kpi-grid" style={{ marginBottom: 30 }}>
        <div className="kpi-card">
          <h4>Total Orders</h4>
          <div className="kpi-value">{activeOrders.length}</div>
        </div>

        <div className="kpi-card">
          <h4>Total Revenue</h4>
          <div className="kpi-value">₦{totalSales.toLocaleString()}</div>
          <small className="muted">Only paid orders are included.</small>
        </div>

        <div className="kpi-card">
          <h4>Today</h4>
          <div className="kpi-value">₦{dailySales.toLocaleString()}</div>
        </div>

        <div className="kpi-card">
          <h4>Last 7 days</h4>
          <div className="kpi-value">₦{weeklySales.toLocaleString()}</div>
        </div>

        <div className="kpi-card">
          <h4>This month</h4>
          <div className="kpi-value">₦{monthlySales.toLocaleString()}</div>
        </div>
      </div>

      {activeOrders.length === 0 ? (
        <div className="card">
          <p>No active sales records available yet.</p>
        </div>
      ) : (
        <div className="admin-sales-grid">
          {activeOrders.map((order) => (
            <div className="order-card" key={order._id}>
              <div className="order-card-header">
                <div>
                  <strong>{order.orderNumber || "Order"}</strong>
                  <div className="muted" style={{ marginTop: 6 }}>
                    {formatDate(order.createdAt, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleArchive(order._id)}
                  disabled={archivingOrderId === order._id}
                >
                  {archivingOrderId === order._id ? "Archiving…" : "Archive"}
                </button>
              </div>

              <div className="order-card-row">
                <span>Customer</span>
                <span>{order.customerName || order.email || "—"}</span>
              </div>

              <div className="order-card-row">
                <span>Amount</span>
                <span>₦{Number(order.totalAmount || 0).toLocaleString()}</span>
              </div>

              <div className="order-card-row">
                <span>Payment</span>
                <span>{order.paymentStatus || "—"}</span>
              </div>

              <div className="order-card-row">
                <span>Delivery</span>
                <span>{order.deliveryStatus || "—"}</span>
              </div>

              <div className="order-card-row">
                <span>State / City</span>
                <span>
                  {order.state || "—"} / {order.city || "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showArchived && (
        <div style={{ marginTop: 40 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div>
              <h2>Archived Sales</h2>
              <p className="muted" style={{ margin: 0 }}>
                Archived records are kept separately from the current active
                sales window.
              </p>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleSearchArchived}
              >
                Search archived
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClearArchiveFilter}
              >
                Clear search
              </button>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: 12,
              marginBottom: 20,
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            }}
          >
            <div>
              <label>Start date</label>
              <input
                type="date"
                value={archiveFilter.startDate}
                onChange={(e) =>
                  setArchiveFilter((prev) => ({
                    ...prev,
                    startDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label>End date</label>
              <input
                type="date"
                value={archiveFilter.endDate}
                onChange={(e) =>
                  setArchiveFilter((prev) => ({
                    ...prev,
                    endDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="kpi-grid" style={{ marginBottom: 20 }}>
            <div className="kpi-card">
              <h4>Archived Orders</h4>
              <div className="kpi-value">{archivedOrdersArray.length}</div>
            </div>
            <div className="kpi-card">
              <h4>Archived Revenue</h4>
              <div className="kpi-value">₦{archivedTotal.toLocaleString()}</div>
            </div>
          </div>

          {archivedOrdersArray.length === 0 ? (
            <div className="card">
              <p>No archived records match this filter.</p>
            </div>
          ) : (
            <div className="admin-sales-grid">
              {archivedOrdersArray.map((order) => (
                <div className="order-card" key={order._id}>
                  <div className="order-card-header">
                    <div>
                      <strong>{order.orderNumber || "Order"}</strong>
                      <div className="muted" style={{ marginTop: 6 }}>
                        {formatDate(order.createdAt, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="order-card-row">
                    <span>Customer</span>
                    <span>{order.customerName || order.email || "—"}</span>
                  </div>

                  <div className="order-card-row">
                    <span>Amount</span>
                    <span>
                      ₦{Number(order.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="order-card-row">
                    <span>Payment</span>
                    <span>{order.paymentStatus || "—"}</span>
                  </div>

                  <div className="order-card-row">
                    <span>Delivery</span>
                    <span>{order.deliveryStatus || "—"}</span>
                  </div>

                  <div className="order-card-row">
                    <span>State / City</span>
                    <span>
                      {order.state || "—"} / {order.city || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
