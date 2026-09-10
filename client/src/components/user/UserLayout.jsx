//client/src/components/user/UserLayout.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import useClickOutside from "../../hooks/useClickOutside";
import { Menu, X, User, ShoppingBag, Home, LogOut, Handshake } from "lucide-react";
import useAuth from "../../context/AuthContext";
import NotificationDropdown from "../NotificationDropdown";
import AvatarUpload from "../AvatarUpload";
import { formatDate } from "../../utils/formatDate";

export default function UserLayout({ children }) {
  const [open, setOpen] = useState(window.innerWidth >= 1024);
  const sidebarRef = useRef(null);
  const menuBtnRef = useRef(null);
  const { logout, user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (window.innerWidth < 1024) setOpen(false);
  }, [location.pathname]);

  useClickOutside(
    [sidebarRef, menuBtnRef],
    () => {
      setOpen(false);
    },
    open,
  );

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const links = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <ShoppingBag size={18} />,
    },

    {
      to: "/cart",
      label: "My Cart",
      icon: <ShoppingBag size={18} />,
    },

    ...(user?.distributorStatus === "approved" ? [{ to: "/distributor", label: "Publisher Dashboard", icon: <ShoppingBag size={18} /> }] : []),

    ...(user?.distributorStatus !== "approved" && user?.distributorStatus !== "pending" ? [{ to: "/dashboard?distributor=apply", label: "Publish With RESYIN", icon: <Handshake size={18} /> }] : []),

    {
      to: "/checkout",
      label: "Checkout",
      icon: <ShoppingBag size={18} />,
    },

    {
      to: "/profile",
      label: "My Profile",
      icon: <User size={18} />,
    },

    {
      to: "/collection",
      label: "Browse Books",
      icon: <Home size={18} />,
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
            onClick={() => setOpen(!open)}
            className="admin-menu-btn"
          >
            <Menu size={24} />
          </button>

          <div className="admin-brand">
            <strong>{user?.name || "User"}</strong>
            <span>Customer Panel</span>
          </div>

          <nav className="user-topbar-links">
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/profile">Profile</Link>
            <Link to="/cart">Cart</Link>
          </nav>
        </div>
        <div className="admin-topbar-right">
          <NotificationDropdown />
        </div>
      </header>

      {/* SIDEBAR */}
      <aside ref={sidebarRef} className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <button onClick={() => setOpen(false)}>
            <X size={22} />
          </button>
        </div>

        <div className="sidebar-user-card">
          <div className="sidebar-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" />
            ) : (
              <AvatarUpload compact onUploaded={setUser} />
            )}
          </div>

          <div className="sidebar-user-info">
            <strong>{user?.name || "User"}</strong>
            {user?.createdAt && (
              <small
                style={{ display: "block", marginTop: "6px", opacity: 0.7 }}
              >
                Since {formatDate(user.createdAt)}
              </small>
            )}
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
      <main className="admin-main" onPointerDown={() => open && setOpen(false)}>{children}</main>
    </div>
  );
}
