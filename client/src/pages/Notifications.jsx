import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { getNotificationActionLabel } from "../utils/notificationDestination";

export default function Notifications() {
  const { isLoggedIn, isAdmin } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    loading,
    unreadCount,
    markNotificationRead,
    markAllAsRead,
    dismissNotification,
  } = useNotifications();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
    }
  }, [isLoggedIn, navigate]);

  const handleOpenNotification = async (notification) => {
    navigate(`/notifications/${notification._id}`);
  };

  return (
    <div className="notifications-page">
      <header className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>
            {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="notification-page-actions">
          <button type="button" onClick={markAllAsRead} disabled={loading}>
            Mark all read
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate(isAdmin ? "/admin" : "/dashboard");
              }
            }}
          >
            Close
          </button>
        </div>
      </header>

      {loading && <p>Loading notifications...</p>}
      {!loading && notifications.length === 0 && (
        <p className="empty-state">No notifications yet.</p>
      )}

      <div className="notification-list">
        {notifications.map((notification) => (
          <article
            key={notification._id}
            className={`notification-item ${notification.read ? "read" : "unread"}`}
            onClick={() => handleOpenNotification(notification)}
            style={{ cursor: notification.link ? "pointer" : "default" }}
          >
            <div className="notification-content">
              <strong>{notification.title || "Notification"}</strong>
              <p>{notification.body}</p>
              <small>{new Date(notification.createdAt).toLocaleString()}</small>
              {notification.data?.productId && (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenNotification(notification);
                  }}
                >
                  {getNotificationActionLabel(notification, isAdmin)}
                </button>
              )}
            </div>

            {!notification.read ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  markNotificationRead(notification._id);
                }}
              >
                Mark read
              </button>
            ) : null}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                dismissNotification(notification._id);
              }}
              aria-label={`Dismiss ${notification.title || "notification"}`}
            >
              Dismiss
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
