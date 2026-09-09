import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function RelatedProductCarousel({ products = [] }) {
  const carouselItems = [
    ...products.slice(0, 8),
    {
      _id: "become-a-distributor",
      type: "distributor-promo",
      category: "EARN WITH RESYIN",
      name: "Become a RESYIN Distributor",
      shortDescription: "Access distributor prices, sell to customers through your own RESYIN link, and manage stock from a dedicated dashboard.",
      coverImage: "/book-cover.png",
    },
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => setActiveIndex(0), [carouselItems.length]);

  useEffect(() => {
    if (carouselItems.length < 2) return undefined;
    const delay = activeIndex === carouselItems.length - 1 ? 30000 : 6500;
    const timer = window.setTimeout(
      () => setActiveIndex((index) => (index + 1) % carouselItems.length),
      delay,
    );
    return () => window.clearTimeout(timer);
  }, [activeIndex, carouselItems.length]);

  const item = carouselItems[activeIndex % carouselItems.length];

  const showPrevious = (event) => {
    event.stopPropagation();
    setActiveIndex((index) => (index - 1 + carouselItems.length) % carouselItems.length);
  };
  const showNext = (event) => {
    event.stopPropagation();
    setActiveIndex((index) => (index + 1) % carouselItems.length);
  };
  const openProduct = () => navigate(`/product/${item._id}`);
  const isDistributorPromo = item.type === "distributor-promo";

  return (
    <section className="collection-product-carousel" aria-label="Featured products">
      <article
        className="service-promo collection-product-promo"
        key={item._id}
        role={isDistributorPromo ? undefined : "link"}
        tabIndex={isDistributorPromo ? undefined : 0}
        onClick={isDistributorPromo ? undefined : openProduct}
        onKeyDown={(event) => {
          if (!isDistributorPromo && (event.key === "Enter" || event.key === " ")) openProduct();
        }}
        aria-label={isDistributorPromo ? "Become a RESYIN Distributor" : `View ${item.name}`}
      >
        <img src={item.coverImage} alt="" aria-hidden="true" />
        <div className="service-promo-overlay" />
        <div className="service-promo-content">
          <span className="service-promo-kicker">{isDistributorPromo ? "FEATURED OPPORTUNITY" : "FEATURED PRODUCT"}</span>
          {item.category && <span className="service-promo-label">{item.category}</span>}
          <h2>{item.name}</h2>
          <p>{item.shortDescription || "View product information, price, availability, and ordering options."}</p>
          {isDistributorPromo ? <Link className="easy-btn easy-btn-primary" to="/dashboard?distributor=apply">See distributor benefits <ArrowRight size={17} /></Link> : <strong className="collection-product-promo-action">View Product <ArrowRight size={17} /></strong>}
        </div>
        {carouselItems.length > 1 && (
          <div className="service-promo-controls">
            <button type="button" onClick={showPrevious} aria-label="Previous product"><ArrowLeft size={17} /></button>
            <div className="service-promo-dots" aria-label="Choose product">
              {carouselItems.map((carouselItem, index) => (
                <button key={carouselItem._id} type="button" className={index === activeIndex ? "active" : ""} onClick={(event) => { event.stopPropagation(); setActiveIndex(index); }} aria-label={`Show ${carouselItem.name}`} />
              ))}
            </div>
            <button type="button" onClick={showNext} aria-label="Next product"><ArrowRight size={17} /></button>
          </div>
        )}
      </article>
    </section>
  );
}
