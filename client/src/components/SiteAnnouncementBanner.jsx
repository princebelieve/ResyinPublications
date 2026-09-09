import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight } from "lucide-react";
import { getTestimonials } from "../services/api";
import useAuth from "../context/AuthContext";
import { getSafeContentLink } from "../utils/contentLinks";

export default function SiteAnnouncementBanner() {
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    getTestimonials(false).then((data) => setItems(Array.isArray(data) ? data.filter((item) => item.bannerEnabled).slice(0, 3) : [])).catch(() => setItems([]));
  }, []);

  useEffect(() => {
    if (!items.length) return undefined;
    const timer = window.setTimeout(() => setVisible(true), 5000);
    return () => window.clearTimeout(timer);
  }, [items.length]);

  useEffect(() => {
    if (items.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % items.length), 4500);
    return () => window.clearInterval(timer);
  }, [items.length]);

  if (!items.length || dismissed || !visible) return null;
  const item = items[index];
  const target = getSafeContentLink(item.linkUrl, `/testimonials#${item._id}`);
  const isExternal = /^https?:\/\//i.test(target);
  function viewPost(event) {
    setDismissed(true);
    if (isLoggedIn) return;
    event.preventDefault();
    sessionStorage.setItem("pendingAnnouncementUrl", target);
    navigate("/login");
  }

  const announcementLink = isExternal ? (
    <a href={target} target="_blank" rel="noreferrer" onClick={viewPost}>
      Read announcement <ArrowRight size={16} aria-hidden="true" />
    </a>
  ) : (
    <Link to={target} onClick={viewPost}>
      Read announcement <ArrowRight size={16} aria-hidden="true" />
    </Link>
  );

  return (
    <aside className="site-announcement-banner" role="status" aria-live="polite">
      <span className="site-announcement-label">{item.contentType || "Announcement"}</span>
      <span className="site-announcement-text">{item.title || item.testimony}</span>
      {announcementLink}
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss announcement">
        <X size={18} aria-hidden="true" />
      </button>
    </aside>
  );
}
