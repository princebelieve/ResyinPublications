import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { getTestimonials } from "../services/api";
import { getSafeContentLink } from "../utils/contentLinks";

const hiddenPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/checkout"];

export default function SitewideImageAdvert() {
  const location = useLocation();
  const [adverts, setAdverts] = useState([]);
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem("sitewideImageAdvertDismissed") === "true");
  const isPrivateArea = location.pathname.startsWith("/admin") || location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/distributor") || hiddenPaths.includes(location.pathname);

  useEffect(() => {
    getTestimonials(false).then((items) => {
      const imagePosts = (Array.isArray(items) ? items : []).filter((item) => {
        const isPromotedHomepageMedia = item.contentType === "homepage-media" && item.featured;
        return item.mediaType === "image" && item.image && (item.sitewideAdvertEnabled || isPromotedHomepageMedia);
      });
      setAdverts(imagePosts);
    }).catch(() => setAdverts([]));
  }, []);
  useEffect(() => {
    if (adverts.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % adverts.length), 6500);
    return () => window.clearInterval(timer);
  }, [adverts.length]);
  if (dismissed || isPrivateArea || !adverts.length) return null;
  const advert = adverts[index % adverts.length];
  const close = () => { sessionStorage.setItem("sitewideImageAdvertDismissed", "true"); setDismissed(true); };
  const target = getSafeContentLink(advert.linkUrl, `/testimonials#${advert._id}`);
  const content = <><img src={advert.image} alt={advert.title || advert.name || "RESYIN promotion"} /><div className="sitewide-image-advert-copy"><strong>{advert.title || advert.name}</strong><span>{advert.testimony}</span></div></>;
  return <aside className="sitewide-image-advert" aria-label="RESYIN promotion"><button type="button" className="sitewide-image-advert-close" onClick={close} aria-label="Dismiss promotion"><X size={17} /></button>{/^https?:\/\//i.test(target) ? <a href={target} target="_blank" rel="noreferrer">{content}</a> : <Link to={target}>{content}</Link>}{adverts.length > 1 && <div className="sitewide-image-advert-dots">{adverts.map((item, itemIndex) => <button key={item._id} type="button" className={itemIndex === index ? "active" : ""} onClick={() => setIndex(itemIndex)} aria-label={`Show advert ${itemIndex + 1}`} />)}</div>}</aside>;
}
