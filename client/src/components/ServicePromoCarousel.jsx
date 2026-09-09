import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

const promotions = [
  { label: "FEATURED AUTHOR", title: "Discover Prof. Johnson A. Egonmwan's collection.", text: "Explore one featured author collection alongside books from the wider RESYIN Publications catalog.", image: "/book-cover.png", to: "/collection", destination: "Featured author collection", action: "Explore the collection" },
  { label: "BESTSELLERS", title: "Leadership, reform, and development titles.", text: "Discover the books that readers turn to for practical insight on institutions, reform, and growth.", image: "/book-cover.png", to: "/collection", destination: "Curated academic and professional titles", action: "Explore bestsellers" },
  { label: "NEW RELEASES", title: "Fresh ideas for institutions and policy.", text: "Find current thinking on governance, management, and nation-building in a collection built for serious readers.", image: "/book-cover.png", to: "/collection", destination: "Research-backed titles and policy classics", action: "See new titles" },
];

export default function ServicePromoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const promotion = promotions[activeIndex];
  useEffect(() => {
    promotions.forEach(({ image }) => { const preload = new Image(); preload.src = image; });
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % promotions.length), 5500);
    return () => window.clearInterval(timer);
  }, []);
  const previous = () => setActiveIndex((index) => (index - 1 + promotions.length) % promotions.length);
  const next = () => setActiveIndex((index) => (index + 1) % promotions.length);
  const action = promotion.to.startsWith("http") ? <a className="easy-btn easy-btn-primary" href={promotion.to}>{promotion.action} <ArrowRight size={17} /></a> : <Link className="easy-btn easy-btn-primary" to={promotion.to}>{promotion.action} <ArrowRight size={17} /></Link>;
  return <section className="service-promo-section reveal" aria-label="RESYIN Publications catalog highlights"><div className="container"><div className="service-promo-carousel"><article className="service-promo service-promo-slide" key={promotion.to}><img className={promotion.imageClass} src={promotion.image} alt="" aria-hidden="true" /><div className="service-promo-overlay" /><div className="service-promo-content"><span className="service-promo-kicker">CATALOG HIGHLIGHT</span><span className="service-promo-label">{promotion.label}</span><h2>{promotion.title}</h2><p>{promotion.text}</p><strong className="service-promo-destination">{promotion.destination}</strong>{action}</div><div className="service-promo-controls"><button type="button" onClick={previous} aria-label="Previous catalog highlight"><ArrowLeft size={17} /></button><div className="service-promo-dots" aria-label="Choose catalog highlight">{promotions.map((item, index) => <button key={item.to} type="button" className={index === activeIndex ? "active" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show ${item.title}`} />)}</div><button type="button" onClick={next} aria-label="Next catalog highlight"><ArrowRight size={17} /></button></div></article></div></div></section>;
}
