import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

export default function RelatedProductCarousel({ products = [] }) {
  const publisherPromo = {
    _id: "publish-with-resyin",
    type: "publisher-promo",
    category: "GROW THE CATALOG",
    name: "Share Your Voice",
    shortDescription: "Bring your book to the RESYIN Publications catalog and connect with readers worldwide. Publishers, authors, and independent creators welcome.",
    coverImage: "/book-cover.png",
  };

  // Intersperse promo after every 8 books
  const carouselItems = [];
  for (let i = 0; i < products.length; i++) {
    carouselItems.push(products[i]);
    if ((i + 1) % 8 === 0) {
      carouselItems.push(publisherPromo);
    }
  }
  // Add promo at the end if not already added
  if (carouselItems.length === 0 || carouselItems[carouselItems.length - 1]._id !== "publish-with-resyin") {
    carouselItems.push(publisherPromo);
  }
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

  if (carouselItems.length === 0) return null;

  const item = carouselItems[activeIndex % carouselItems.length];
  const isPublisherPromo = item.type === "publisher-promo";

  const move = (direction) => {
    setActiveIndex((index) => (index + direction + carouselItems.length) % carouselItems.length);
  };

  const openBook = () => navigate(`/product/${item._id}`);

  return (
    <section className="resyin-advert" aria-label="Featured books and publishing">
      <div className="container">
        <div className="resyin-advert-frame">
          <div className="resyin-advert-image-wrap">
            <img src={item.coverImage} alt="" className="resyin-advert-image" />
            <span className="resyin-advert-index">0{activeIndex + 1} / 0{carouselItems.length}</span>
          </div>
          <div className="resyin-advert-copy">
            <div className="resyin-advert-label"><BookOpen size={16} /> {item.category}</div>
            <h2>{item.name}</h2>
            <p>{item.shortDescription}</p>
            {isPublisherPromo ? (
                <Link to="/publish-with-us" className="resyin-advert-link">
                Publish with us <ArrowRight size={16} />
              </Link>
            ) : (
              <button 
                type="button"
                onClick={openBook}
                className="resyin-advert-link"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#d17a3f", fontSize: "1rem", fontWeight: 500, display: "flex", alignItems: "center", gap: "8px" }}
              >
                View book <ArrowRight size={16} />
              </button>
            )}
          </div>
          {carouselItems.length > 1 && (
            <div className="resyin-advert-controls">
              <button type="button" onClick={() => move(-1)} aria-label="Previous"><ArrowLeft size={17} /></button>
              <div className="resyin-advert-dots" aria-label="Select featured item">
                {carouselItems.map((book, index) => (
                  <button key={book._id} type="button" className={index === activeIndex ? "active" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show ${book.name}`} />
                ))}
              </div>
              <button type="button" onClick={() => move(1)} aria-label="Next"><ArrowRight size={17} /></button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
