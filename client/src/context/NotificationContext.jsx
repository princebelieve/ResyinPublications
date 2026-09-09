/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getNotifications,
  markNotificationRead as markNotificationReadApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
  dismissNotification as dismissNotificationApi,
} from "../services/api";
import useAuth from "./AuthContext";
import { playNotificationTone } from "../utils/notificationTone";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { token, isLoggedIn } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const prevUnreadCountRef = useRef(0);

  const fetchNotifications = useCallback(async () => {
    if (!token || !isLoggedIn) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getNotifications();
      setNotifications(
        Array.isArray(data.notifications) ? data.notifications : [],
      );
    } catch (err) {
      console.error("Unable to load notifications", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.read).length;
  }, [notifications]);

  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current && unreadCount > 0) {
      playNotificationTone();
    }

    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount]);

  const updateAppBadge = useCallback(async () => {
    const count = unreadCount;

    try {
      if (typeof navigator.setAppBadge === "function") {
        if (count > 0) {
          await navigator.setAppBadge(count);
        } else {
          await navigator.clearAppBadge();
        }
        return;
      }

      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;

        if (count > 0 && typeof registration.setAppBadge === "function") {
          await registration.setAppBadge(count);
        } else if (typeof registration.clearAppBadge === "function") {
          await registration.clearAppBadge();
        }
      }
    } catch (error) {
      console.warn("Unable to update app badge", error);
    }
  }, [unreadCount]);

  // Update PWA app badge with unread count
  useEffect(() => {
    updateAppBadge();
  }, [updateAppBadge]);

  const markNotificationRead = useCallback(async (id) => {
    try {
      await markNotificationReadApi(id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, read: true } : item)),
      );
    } catch (err) {
      console.error("Unable to mark notification read", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsReadApi();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    } catch (err) {
      console.error("Unable to mark all notifications read", err);
    }
  }, []);

  const dismissNotification = useCallback(async (id) => {
    try {
      await dismissNotificationApi(id);
      setNotifications((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      console.error("Unable to dismiss notification", err);
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      loading,
      error,
      unreadCount,
      fetchNotifications,
      markNotificationRead,
      markAllAsRead,
      dismissNotification,
    }),
    [
      error,
      fetchNotifications,
      loading,
      markAllAsRead,
      dismissNotification,
      markNotificationRead,
      notifications,
      unreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
