import { useEffect, useState } from "react";
import useAuth from "../context/AuthContext";
import {
  getAdminUsers,
  updateAdminUser,
  createNotification,
} from "../services/api";
import { formatDate } from "../utils/formatDate";

export default function AdminUsers() {
  const { token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationState, setNotificationState] = useState({
    userId: null,
    showForm: false,
    isLoading: false,
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await getAdminUsers(token);
        setUsers(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  async function toggleSuspend(user) {
    try {
      await updateAdminUser(
        user._id,
        { isSuspended: !user.isSuspended },
        token,
      );
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isSuspended: !u.isSuspended } : u,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function toggleDelete(user) {
    try {
      await updateAdminUser(user._id, { isDeleted: !user.isDeleted }, token);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === user._id ? { ...u, isDeleted: !u.isDeleted } : u,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function permanentlyDeleteUser(user) {
    const userName = user.name || user.email || "this user";
    const confirmed = window.confirm(
      `Permanently delete ${userName}? This removes the account and related cart/token data and cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await updateAdminUser(user._id, { permanentDelete: true }, token);
      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (err) {
      console.error(err);
      alert("Failed to permanently delete user.");
    }
  }

  async function changeRole(user, newRole) {
    try {
      await updateAdminUser(user._id, { role: newRole }, token);
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, role: newRole } : u)),
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function changeDistributorStatus(user, distributorStatus) {
    try {
      const response = await updateAdminUser(user._id, { distributorStatus }, token);
      setUsers((prev) => prev.map((u) => u._id === user._id ? { ...u, ...response.user } : u));
    } catch (err) { console.error(err); }
  }

  function handleSendNotification(userId) {
    setNotificationState({
      userId: userId,
      showForm: true,
      isLoading: false,
    });
  }

  function closeSendNotification() {
    setNotificationState({
      userId: null,
      showForm: false,
      isLoading: false,
    });
  }

  async function sendQuickNotification(e) {
    e.preventDefault();
    setNotificationState((prev) => ({ ...prev, isLoading: true }));

    try {
      const title = document.getElementById("notification-title")?.value;
      const body = document.getElementById("notification-body")?.value;

      if (!title || !body) {
        alert("Please enter both title and message");
        setNotificationState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      await createNotification({
        userId: notificationState.userId,
        type: "general",
        title,
        body,
        link: "",
      });

      alert("Notification sent successfully!");
      closeSendNotification();
    } catch (err) {
      console.error(err);
      alert("Failed to send notification: " + (err.message || "Unknown error"));
      setNotificationState((prev) => ({ ...prev, isLoading: false }));
    }
  }

  if (loading) return <div className="admin-card">Loading users...</div>;

  return (
    <div>
      <h1 className="title">Users</h1>

      {users.length === 0 ? (
        <div className="admin-card">No users found</div>
      ) : (
        <div className="admin-grid">
          {users.map((u) => (
            <div key={u._id} className="admin-card">
              <h3>{u.name || "(no name)"}</h3>
              <p>
                <strong>ID:</strong> {u._id}
              </p>
              <p>{u.email}</p>
              <div style={{ marginBottom: 12 }}>
                <strong>Role:</strong>{" "}
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u, e.target.value)}
                  style={{
                    marginLeft: 8,
                    padding: 4,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                  }}
                >
                  <option value="user">User</option>
                  <option value="subadmin">Subadmin</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Distributor:</strong>{" "}
                <select value={u.distributorStatus || "none"} onChange={(e) => changeDistributorStatus(u, e.target.value)} style={{ marginLeft: 8, padding: 4, borderRadius: 4, border: "1px solid #ccc" }}>
                  <option value="none">Not a distributor</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="suspended">Suspended</option>
                </select>
                {u.distributorCode && <small style={{ display: "block", marginTop: 4 }}>Code: {u.distributorCode}</small>}
              </div>
              {u.distributorStatus === "pending" && (
                <div className="admin-distributor-application">
                  <strong>Application details</strong>
                  <p><b>Business:</b> {u.distributorBusinessName || "Not provided"}</p>
                  <p><b>Phone:</b> {u.phone || "Not provided"}</p>
                  <p><b>Pickup:</b> {u.distributorPickupAddress || "Not provided"}</p>
                  {u.distributorDeliveryCoverage && <p><b>Delivery area:</b> {u.distributorDeliveryCoverage}</p>}
                  <p><b>Payment account:</b> {u.distributorBankName || "—"} · {u.distributorAccountName || "—"} · {u.distributorAccountNumber || "—"}</p>
                  {u.distributorApplicationNote && <p><b>Note:</b> {u.distributorApplicationNote}</p>}
                </div>
              )}
              <p>
                <strong>Joined:</strong> {formatDate(u.createdAt)}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {u.isDeleted
                  ? "Deleted"
                  : u.deletionRequestedAt
                    ? "Deletion requested"
                  : u.isSuspended
                    ? "Suspended"
                    : "Active"}
              </p>
              {u.deletionRequestedAt && (
                <p>
                  <strong>Request:</strong> {formatDate(u.deletionRequestedAt)}
                  {u.deletionRequestReason ? ` — ${u.deletionRequestReason}` : ""}
                </p>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button onClick={() => toggleSuspend(u)} className="btn">
                  {u.isSuspended ? "Restore" : "Suspend"}
                </button>

                <button
                  onClick={() => toggleDelete(u)}
                  className="btn btn-danger"
                >
                  {u.isDeleted ? "Restore" : u.deletionRequestedAt ? "Approve deletion" : "Soft Delete"}
                </button>

                <button
                  onClick={() => permanentlyDeleteUser(u)}
                  className="btn btn-danger"
                  style={{ backgroundColor: "#b42318" }}
                >
                  Permanent delete
                </button>

                <button
                  onClick={() => handleSendNotification(u._id)}
                  className="btn"
                  style={{ backgroundColor: "#4CAF50" }}
                >
                  Send Notification
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {notificationState.showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: 24,
              borderRadius: 8,
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              width: "90%",
              maxWidth: 400,
            }}
          >
            <h2>Send Notification to User</h2>
            <form onSubmit={sendQuickNotification}>
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="notification-title">Title</label>
                <input
                  id="notification-title"
                  type="text"
                  placeholder="Notification title"
                  required
                  style={{
                    width: "100%",
                    padding: 8,
                    marginTop: 4,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label htmlFor="notification-body">Message</label>
                <textarea
                  id="notification-body"
                  placeholder="Notification message"
                  required
                  rows={4}
                  style={{
                    width: "100%",
                    padding: 8,
                    marginTop: 4,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  disabled={notificationState.isLoading}
                  style={{
                    flex: 1,
                    padding: 8,
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: 4,
                    cursor: notificationState.isLoading
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  {notificationState.isLoading ? "Sending..." : "Send"}
                </button>
                <button
                  type="button"
                  onClick={closeSendNotification}
                  style={{
                    flex: 1,
                    padding: 8,
                    backgroundColor: "#ccc",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
