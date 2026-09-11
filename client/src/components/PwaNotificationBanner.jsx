import { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";
import { ensurePushSubscription } from "../registerServiceWorker";

export default function PwaNotificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Only show on browsers that support push notifications
    const supportsPush =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

    if (!supportsPush) {
      return;
    }

    // Check if permission is already granted
    const syncSubscription = () => {
      if (Notification.permission === "granted") ensurePushSubscription();
    };

    if (Notification.permission === "granted") {
      ensurePushSubscription();
      window.addEventListener("online", syncSubscription);
      document.addEventListener("visibilitychange", syncSubscription);
      return () => {
        window.removeEventListener("online", syncSubscription);
        document.removeEventListener("visibilitychange", syncSubscription);
      };
    }

    // Check if user previously dismissed the banner
    const dismissed = localStorage.getItem("pwaBannerDismissed");
    if (dismissed) {
      return;
    }

    // Show banner only if permission is not denied
    if (Notification.permission !== "denied") {
      setShowBanner(true);
    }

    return undefined;
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);

    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        await ensurePushSubscription();
        setShowBanner(false);
        console.log("Push notifications enabled");
      } else if (permission === "denied") {
        setShowBanner(false);
      }
    } catch (error) {
      console.error("Push notification request failed:", error);
    } finally {
      setSubscribing(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwaBannerDismissed", "true");
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="resyin-notification-card">
      <div className="resyin-notification-content">
        <Bell size={20} className="resyin-notification-icon" />
        <div>
          <strong>Stay close to your reading life</strong>
          <p>Receive order and catalog updates when you choose.</p>
        </div>
      </div>

      <div className="resyin-notification-actions">
        <button
          type="button"
          className="resyin-notification-accept"
          onClick={handleSubscribe}
          disabled={subscribing}
        >
          {subscribing ? "..." : "Allow updates"}
        </button>
        <button
          type="button"
          className="resyin-notification-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
