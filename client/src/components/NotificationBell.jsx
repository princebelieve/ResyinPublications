import { Bell } from "lucide-react";

export default function NotificationBell({
  count = 0,
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`notification-bell ${className}`}
      aria-label="Open notifications"
    >
      <Bell size={20} />
      {count > 0 ? <span className="notification-badge">{count}</span> : null}
    </button>
  );
}
