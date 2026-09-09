import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import NotificationBell from "./NotificationBell";
import useClickOutside from "../hooks/useClickOutside";
import { useNotifications } from "../context/NotificationContext";
import { normalizeNotificationLink } from "../utils/notificationLinks";
import { getNotificationDestination } from "../utils/notificationDestination";
import useAuth from "../context/AuthContext";

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const {
    notifications,
    loading,
    unreadCount,
    fetchNotifications,
    markNotificationRead,
  } = useNotifications();

  useClickOutside([dropdownRef], () => setOpen(false), open);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [fetchNotifications, open]);

  const latestNotifications = notifications.slice(0, 4);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markNotificationRead(notification._id);
    }

    setOpen(false);

    const target = getNotificationDestination(notification, isAdmin);

    if (typeof target === "string" && /^(https?:|mailto:)/i.test(target)) {
      window.open(target, "_blank", "noopener,noreferrer");
    } else if (typeof target === "string") {
      navigate(normalizeNotificationLink(target));
    }
  };

  return (
    <div ref={dropdownRef} className="notification-dropdown-wrapper">
      <NotificationBell
        count={unreadCount}
        onClick={() => setOpen((prev) => !prev)}
        className={open ? "active" : ""}
      />

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Notifications</span>
            <small>{unreadCount} unread</small>
          </div>

          {loading && (
            <div className="notification-dropdown-empty">Loading...</div>
          )}

          {!loading && latestNotifications.length === 0 && (
            <div className="notification-dropdown-empty">
              No notifications yet.
            </div>
          )}

          <div className="notification-dropdown-items">
            {latestNotifications.map((notification) => (
              <button
                key={notification._id}
                type="button"
                className={`notification-dropdown-item ${notification.read ? "read" : "unread"}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div>
                  <strong>{notification.title || "Notification"}</strong>
                  <p>{notification.body}</p>
                </div>
                <ChevronRight size={18} />
              </button>
            ))}
          </div>

          <button
            type="button"
            className="notification-dropdown-view-all"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
