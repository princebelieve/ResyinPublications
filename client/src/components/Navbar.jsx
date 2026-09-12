//client/src/components/Navbar.jsx
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Search, ShoppingCart } from "lucide-react";
import useAuth from "../context/AuthContext";
import useClickOutside from "../hooks/useClickOutside";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import NotificationDropdown from "./NotificationDropdown";
import NotificationBell from "./NotificationBell";
import PwaInstallButton from "./PwaInstallButton";

export default function Navbar() {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const { isLoggedIn, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const { unreadCount } = useNotifications();

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const accountMenuRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [useLegacyInstallButton] = useState(false);

  useEffect(() => {
    const installedHandler = () => setIsInstalled(true);

    window.addEventListener("appinstalled", installedHandler);

    // detect standalone (iOS added to home screen)
    if (
      window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  useEffect(() => {
    const updateMobile = () => {
      setIsMobileScreen(window.matchMedia("(max-width: 900px)").matches);
    };

    updateMobile();
    window.addEventListener("resize", updateMobile);
    return () => window.removeEventListener("resize", updateMobile);
  }, []);

  useClickOutside([menuRef, buttonRef], () => setOpen(false), open);

  useEffect(() => {
    function closeDesktopAccountMenu(event) {
      const menu = accountMenuRef.current;
      if (!menu?.hasAttribute("open")) return;
      if (event.type === "keydown" && event.key !== "Escape") return;
      if (event.type !== "keydown" && menu.contains(event.target)) return;
      menu.removeAttribute("open");
    }

    document.addEventListener("pointerdown", closeDesktopAccountMenu, true);
    document.addEventListener("keydown", closeDesktopAccountMenu);
    return () => {
      document.removeEventListener("pointerdown", closeDesktopAccountMenu, true);
      document.removeEventListener("keydown", closeDesktopAccountMenu);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function handleLogout() {
    logout();
    navigate("/login");
    setOpen(false);
  }

  return (
    <>
    <nav className="navbar bookstore-navbar">
      <Link to="/" className="navbar-brand" onClick={() => setOpen(false)}>
        <img src="/logo.png" alt="RESYIN Publications" className="store-brand-mark" />
        <span className="brand-name">RESYIN <span>PUBLICATIONS</span></span>
      </Link>
      <form className="store-search" role="search" onSubmit={(event) => { event.preventDefault(); navigate(`/collection?q=${encodeURIComponent(query.trim())}`); setOpen(false); }}>
        <label htmlFor="store-query">Books</label>
        <input id="store-query" type="search" aria-label="Search books, authors and subjects" placeholder="Search books, authors and subjects" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="submit" aria-label="Search"><Search size={23} /></button>
      </form>
      <div className="desktop-nav">
        <details ref={accountMenuRef} className="store-account"><summary>{isLoggedIn ? "Your account" : "Hello, sign in"}</summary><div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/collection">Browse Books</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/how-to-use">Reader Guide</Link>

          {isLoggedIn && <Link to="/cart">Cart</Link>}

          {isLoggedIn && <Link to="/dashboard">Dashboard</Link>}

          {isLoggedIn && <Link to="/publish-with-us">Publish with us</Link>}

          {isAdmin && <Link to="/admin">Admin</Link>}

          {!isLoggedIn ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>

        </details>
        <div className="nav-actions">
          <NotificationDropdown />

          <PwaInstallButton />

          {isLoggedIn && (
            <button
              type="button"
              className="cart-btn"
              onClick={() => navigate("/cart")}
            >
              Cart ({cartCount})
            </button>
          )}

          <button
            type="button"
            className="cta store-cart"
            onClick={() => navigate("/cart")}
          >
            <ShoppingCart size={22} /> Cart ({cartCount})
          </button>
        </div>
      </div>

      <div className="mobile-nav-actions">
        {isLoggedIn && (
          <NotificationBell
            count={unreadCount}
            onClick={() => navigate("/notifications")}
          />
        )}
        <PwaInstallButton />
        {/* PWA install icon (mobile only, only when not installed) */}
        {useLegacyInstallButton && isMobileScreen && !isInstalled && (
          <button
            type="button"
            className="install-btn"
            onClick={async () => {
              const isiOS =
                /iphone|ipad|ipod/i.test(navigator.userAgent) &&
                !window.navigator.standalone;

              if (isiOS) {
                navigate("/install-instructions");
                return;
              }

              const installPrompt = deferredPrompt || window.__deferredPrompt;
              if (installPrompt) {
                installPrompt.prompt();
                const choice = await installPrompt.userChoice;
                if (choice && choice.outcome === "accepted") {
                  setDeferredPrompt(null);
                  window.__deferredPrompt = null;
                  setIsInstalled(true);
                }
                return;
              }

              if (typeof window !== "undefined") {
                window.alert(
                  "Open this page in Chrome and tap the menu (⋮) → Add to Home screen to install the app.",
                );
              }
            }}
            aria-label="Install app"
            title="Install RESYIN PUBLICATIONS"
          >
            <Download size={20} />
          </button>
        )}
      </div>

      <button
        ref={buttonRef}
        type="button"
        className="hamburger"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        aria-expanded={open}
        aria-controls="store-mobile-menu"
      >
        {open ? <X size={30} /> : <Menu size={30} />}
      </button>

      <div
        id="store-mobile-menu"
        inert={!open}
        ref={menuRef}
        className={`mobile-menu-overlay ${open ? "active" : ""}`}
      >
        <div className="mobile-menu-links">
          <Link to="/" onClick={() => setOpen(false)}>
            Home
          </Link>

          <Link to="/collection" onClick={() => setOpen(false)}>
            Browse Books
          </Link>

          <Link to="/about" onClick={() => setOpen(false)}>
            About
          </Link>

          <Link to="/contact" onClick={() => setOpen(false)}>
            Contact
          </Link>

          <Link to="/how-to-use" onClick={() => setOpen(false)}>
            Reader Guide
          </Link>

          {isLoggedIn && (
            <Link to="/cart" onClick={() => setOpen(false)}>
              Cart ({cartCount})
            </Link>
          )}

          <Link to="/notifications" onClick={() => setOpen(false)}>
            Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
          </Link>

          {isLoggedIn && (
            <>
              <Link to="/dashboard" onClick={() => setOpen(false)}>
                My Orders
              </Link>

              <Link to="/publish-with-us" onClick={() => setOpen(false)}>
                Publish with us
              </Link>

              <Link to="/profile" onClick={() => setOpen(false)}>
                Profile
              </Link>
            </>
          )}

          {isAdmin && (
            <Link to="/admin/products" onClick={() => setOpen(false)}>
              Admin
            </Link>
          )}

          {!isLoggedIn ? (
            <>
              <Link to="/login" onClick={() => setOpen(false)}>
                Login
              </Link>

              <Link to="/register" onClick={() => setOpen(false)}>
                Register
              </Link>
            </>
          ) : (
            <button
              type="button"
              className="mobile-logout"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
    <div className="store-subnav"><Link to="/collection">All books</Link><Link to="/author/johnson-egonmwan">Dr. Johnson A. Egonmwan</Link><Link to="/collection?sort=newest">Latest additions</Link><Link to="/contact">Publish with us</Link><Link to="/support">Customer service</Link></div>
    </>
  );
}
