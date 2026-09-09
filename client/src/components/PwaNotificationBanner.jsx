import { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";
import { ensurePushSubscription } from "../registerServiceWorker";

export default function PwaNotificationBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Only show on browsers that support push notifications
    const supportsPush =
      "serviceWorker" in navigator && "PushManager" in window;

    if (!supportsPush) {
      return;
    }

    // Check if permission is already granted
    if (Notification.permission === "granted") {
      ensurePushSubscription();
      return;
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
    <div className="pwa-notification-banner">
      <div className="pwa-banner-content">
        <Bell size={20} className="pwa-banner-icon" />
        <div>
          <strong>Enable notifications</strong>
          <p>Stay updated on your orders and special offers</p>
        </div>
      </div>

      <div className="pwa-banner-actions">
        <button
          type="button"
          className="pwa-btn-enable"
          onClick={handleSubscribe}
          disabled={subscribing}
        >
          {subscribing ? "..." : "Enable"}
        </button>
        <button
          type="button"
          className="pwa-btn-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
