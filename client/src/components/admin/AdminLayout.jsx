//client/src/components/admin/AdminLayout.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import useClickOutside from "../../hooks/useClickOutside";
import useAuth from "../../context/AuthContext";
import NotificationDropdown from "../NotificationDropdown";
import AvatarUpload from "../AvatarUpload";

import {
  Menu,
  X,
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  UsersRound,
  AlertTriangle,
  Truck,
  MapPinned,
  WalletCards,
  MessageSquare,
  Video,
  Home,
  User,
  Bell,
  LogOut,
  Handshake,
} from "lucide-react";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  const sidebarRef = useRef(null);
  const menuBtnRef = useRef(null);

  const { logout, user, setUser } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useClickOutside(
    [sidebarRef, menuBtnRef],
    () => {
      setSidebarOpen(false);
    },
    sidebarOpen,
  );

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const links = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },

    {
      to: "/admin/products",
      label: "Products",
      icon: <Package size={18} />,
    },

    {
      to: "/admin/orders",
      label: "Orders",
      icon: <ShoppingCart size={18} />,
    },

    {
      to: "/admin/distributors",
      label: "Distributors",
      icon: <UsersRound size={18} />,
    },

    {
      to: "/admin/sales",
      label: "Sales",
      icon: <BarChart3 size={18} />,
    },

    {
      to: "/admin/stock",
      label: "Stock Alerts",
      icon: <AlertTriangle size={18} />,
    },

    {
      to: "/admin/delivery",
      label: "Delivery Board",
      icon: <Truck size={18} />,
    },

    {
      to: "/admin/shipping",
      label: "Shipping Zones",
      icon: <MapPinned size={18} />,
    },

    {
      to: "/admin/transport-companies",
      label: "Transport Companies",
      icon: <Truck size={18} />,
    },

    {
      to: "/admin/payment-settings",
      label: "Payment Settings",
      icon: <WalletCards size={18} />,
    },

    {
      to: "/admin/publisher-subscription-settings",
      label: "Publisher Subscription",
      icon: <WalletCards size={18} />,
    },

    {
      to: "/admin/inquiries",
      label: "Inquiries",
      icon: <MessageSquare size={18} />,
    },

    {
      to: "/admin/content",
      label: "Content Studio",
      icon: <Video size={18} />,
    },

    {
      to: "/admin/users",
      label: "Users",
      icon: <User size={18} />,
    },

    {
      to: "/admin/send-notification",
      label: "Send Notification",
      icon: <Bell size={18} />,
    },

    {
      to: "/dashboard",
      label: "Personal Dashboard",
      icon: <User size={18} />,
    },

    ...(user?.distributorStatus === "approved" ? [{
      to: "/distributor",
      label: "Distributor Dashboard",
      icon: <Handshake size={18} />,
    }] : user?.distributorStatus !== "pending" ? [{
      to: "/dashboard?distributor=apply",
      label: "Become a Distributor",
      icon: <Handshake size={18} />,
    }] : []),

    {
      to: "/profile",
      label: "My Profile",
      icon: <User size={18} />,
    },

    {
      to: "/",
      label: "Home",
      icon: <Home size={18} />,
    },
  ];

  return (
    <div className="admin-shell">
      {/* TOPBAR */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button
            ref={menuBtnRef}
            className="admin-menu-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <Menu size={24} />
          </button>

          <Link to="/admin" className="admin-brand">
            <img src="/logo.png" alt="RESYIN Publications" className="admin-logo" />

            <div>
              <strong>RESYIN</strong>

              <span>Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* DESKTOP QUICK NAV */}
        <nav className="admin-desktop-nav">
          <Link to="/admin">Dashboard</Link>

          <Link to="/admin/products">Products</Link>

          <Link to="/admin/orders">Orders</Link>

          <Link to="/admin/sales">Sales</Link>
        </nav>

        <div className="admin-topbar-right">
          <NotificationDropdown />
        </div>
      </header>

      {/* MOBILE OVERLAY */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        ref={sidebarRef}
        className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}
      >
        <div className="admin-sidebar-header">
          <button onClick={() => setSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>

        <div className="sidebar-user-card">
          <div className="sidebar-avatar admin-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" />
            ) : (
              <AvatarUpload compact onUploaded={setUser} />
            )}
          </div>

          <div className="sidebar-user-info">
            <strong>{user?.name || "Admin"}</strong>
            <span>{user?.email}</span>
          </div>
        </div>

        <div className="admin-sidebar-links">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={
                `${location.pathname}${location.search}` === link.to ? "active-admin-link" : ""
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}

          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <main className="admin-main">{children}</main>
    </div>
  );
}
