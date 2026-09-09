import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../context/AuthContext";
import {
  createNotification,
  broadcastNotification,
  getNotificationRequests,
  getMyNotificationRequests,
  approveNotificationRequest,
  rejectNotificationRequest,
} from "../services/api";
import { getToken } from "../utils/auth";

export default function AdminNotifications() {
  const { isAdmin, isSubadmin, isAdminOrSubadmin, loading } = useAuth();
  const [formData, setFormData] = useState({
    userId: "",
    type: "announcement",
    title: "",
    body: "",
    link: "",
  });
  const [sendToAll, setSendToAll] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    if (!isAdminOrSubadmin) return;

    async function loadRequests() {
      setRequestsLoading(true);
      try {
        const res = isAdmin
          ? await getNotificationRequests(getToken())
          : await getMyNotificationRequests(getToken());

        setRequests(Array.isArray(res.requests) ? res.requests : []);
      } catch (err) {
        console.error("Unable to load notification requests", err);
      } finally {
        setRequestsLoading(false);
      }
    }

    loadRequests();
  }, [isAdminOrSubadmin, isAdmin]);

  if (loading) return null;

  if (!isAdminOrSubadmin) {
    return <Navigate to="/login" replace />;
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendToAllChange = (e) => {
    setSendToAll(e.target.checked);
    if (e.target.checked) {
      // Clear userId when sending to all
      setFormData((prev) => ({
        ...prev,
        userId: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      let response;

      if (sendToAll) {
        // Broadcast to all users
        const broadcastData = {
          type: formData.type,
          title: formData.title,
          body: formData.body,
          link: formData.link,
        };
        response = await broadcastNotification(broadcastData);

        setMessageType("success");
        setMessage(
          isAdmin
            ? `Notification sent to ${response.notificationCount || "all"} users successfully!`
            : "Broadcast notification request submitted for admin approval.",
        );
      } else {
        // Send to specific user
        if (!formData.userId) {
          setMessageType("error");
          setMessage("Please enter a user ID or select 'Send to All Users'");
          setSubmitting(false);
          return;
        }

        response = await createNotification(formData);

        setMessageType("success");
        setMessage(
          isAdmin
            ? "Notification sent successfully!"
            : "Notification request submitted for admin approval.",
        );
      }

      setFormData({
        userId: "",
        type: "announcement",
        title: "",
        body: "",
        link: "",
      });
      setSendToAll(false);
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Failed to send notification");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-notifications-page">
      <header className="page-header">
        <div>
          <h1>Send Notification</h1>
          <p>Create and send notifications to users</p>
        </div>
      </header>

      <div className="admin-notification-form-container">
        <form onSubmit={handleSubmit} className="admin-notification-form">
          {message && (
            <div className={`form-message ${messageType}`}>{message}</div>
          )}

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={sendToAll}
                onChange={handleSendToAllChange}
                style={{ marginRight: 8 }}
              />
              Send to All Users
            </label>
            <small>Check this to send notification to all active users</small>
          </div>

          {!sendToAll && (
            <div className="form-group">
              <label htmlFor="userId">Recipient User ID</label>
              <input
                id="userId"
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                placeholder="Enter recipient user ID"
                required={!sendToAll}
              />
              <small>User ID who will receive this notification</small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="type">Notification Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="announcement">Announcement</option>
              <option value="promotion">Promotion</option>
              <option value="alert">Alert</option>
              <option value="general">General</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Notification title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="body">Message</label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              placeholder="Notification message"
              rows={5}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="link">Link (Optional)</label>
            <input
              id="link"
              type="text"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="/dashboard or /admin/products etc."
            />
            <small>
              Where users should navigate when clicking notification
            </small>
          </div>

          <button type="submit" disabled={submitting} className="submit-btn">
            {submitting
              ? sendToAll
                ? "Broadcasting..."
                : "Sending..."
              : sendToAll
                ? "Broadcast to All Users"
                : "Send Notification"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: 24 }}>
        <h2>
          {isAdmin
            ? "Pending Notification Requests"
            : "Your Notification Requests"}
        </h2>

        {isSubadmin && (
          <p style={{ color: "#555", marginTop: 8 }}>
            Notification submissions are reviewed by admins before they are
            sent.
          </p>
        )}

        {requestsLoading ? (
          <p>Loading requests...</p>
        ) : requests.length === 0 ? (
          <p>
            {isAdmin
              ? "No pending requests."
              : "You have not submitted any notification requests yet."}
          </p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {requests.map((r) => (
              <div
                key={r._id}
                style={{ border: "1px solid #ddd", padding: 12 }}
              >
                <p>
                  <strong>From:</strong> {r.senderName} ({r.senderRole})
                </p>
                <p>
                  <strong>To:</strong> {r.userId || "(broadcast)"}
                </p>
                {r.status && (
                  <p>
                    <strong>Status:</strong> {r.status}
                  </p>
                )}
                <p>
                  <strong>Title:</strong> {r.title}
                </p>
                <p>{r.body}</p>
                {isAdmin && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      onClick={async () => {
                        try {
                          await approveNotificationRequest(r._id, getToken());
                          const res = await getNotificationRequests(getToken());
                          setRequests(
                            Array.isArray(res.requests) ? res.requests : [],
                          );
                        } catch (err) {
                          console.error(err);
                          alert(err.message || "Unable to approve request");
                        }
                      }}
                    >
                      Approve
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await rejectNotificationRequest(r._id, getToken());
                          const res = await getNotificationRequests(getToken());
                          setRequests(
                            Array.isArray(res.requests) ? res.requests : [],
                          );
                        } catch (err) {
                          console.error(err);
                          alert(err.message || "Unable to reject request");
                        }
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-notifications-info">
        <h3>Guidelines</h3>
        <ul>
          <li>
            <strong>Title:</strong> Keep it short and clear (max 50 characters)
          </li>
          <li>
            <strong>Message:</strong> Provide context and action items
          </li>
          <li>
            <strong>Link:</strong> Direct users to relevant pages
          </li>
          <li>
            <strong>Type:</strong> Use appropriate notification type for
            filtering
          </li>
        </ul>
      </div>
    </div>
  );
}
