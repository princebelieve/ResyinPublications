import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuth from "../context/AuthContext";
import { getNotificationById } from "../services/api";
import { useNotifications } from "../context/NotificationContext";
import { getNotificationActionLabel, getNotificationDestination } from "../utils/notificationDestination";

export default function NotificationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { markNotificationRead } = useNotifications();
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getNotificationById(id)
      .then(async ({ notification: item }) => {
        setNotification(item);
        if (!item.read) await markNotificationRead(item._id);
      })
      .catch((err) => setError(err.message || "Notification not found."));
  }, [id, markNotificationRead]);

  if (error) return <main className="page"><p>{error}</p><button type="button" onClick={() => navigate("/notifications")}>Back to notifications</button></main>;
  if (!notification) return <main className="page"><p>Loading notification...</p></main>;

  const target = getNotificationDestination(notification, isAdmin);
  return <main className="page notification-detail-page"><button type="button" onClick={() => navigate("/notifications")}>Back to notifications</button><h1>{notification.title || "Notification"}</h1><p>{notification.body}</p><small>{new Date(notification.createdAt).toLocaleString()}</small><div><button type="button" onClick={() => navigate(target)}>{getNotificationActionLabel(notification, isAdmin)}</button><button type="button" onClick={() => navigate("/notifications")}>Close</button></div></main>;
}
