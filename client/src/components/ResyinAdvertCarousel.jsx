import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

const adverts = [
  {
    label: "FEATURED COLLECTION",
    title: "Ideas worth returning to.",
    text: "Explore selected books from authors whose work rewards careful reading.",
    image: "/book-cover.png",
    link: "/collection",
    action: "Browse the catalog",
  },
  {
    label: "AUTHOR SPOTLIGHT",
    title: "A distinguished voice in public life.",
    text: "Discover Prof. Johnson A. Egonmwan's books as one collection within the wider RESYIN catalog.",
    image: "/prof.png",
    link: "/collection?q=Egonmwan",
    action: "View author titles",
  },
  {
    label: "FOR AUTHORS & PUBLISHERS",
    title: "Give your next book a place to be found.",
    text: "Talk to RESYIN about bringing your title to readers, schools, and institutions.",
    image: "/let's learn about nigeria.png",
    link: "/contact",
    action: "Publish with us",
  },
];

export default function ResyinAdvertCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const advert = adverts[activeIndex];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % adverts.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, []);

  const move = (direction) => {
    setActiveIndex((index) => (index + direction + adverts.length) % adverts.length);
  };

  return (
    <section className="resyin-advert" aria-label="RESYIN catalog highlights">
      <div className="container">
        <div className="resyin-advert-frame">
          <div className="resyin-advert-image-wrap">
            <img src={advert.image} alt="" className="resyin-advert-image" />
            <span className="resyin-advert-index">0{activeIndex + 1} / 0{adverts.length}</span>
          </div>
          <div className="resyin-advert-copy">
            <div className="resyin-advert-label"><BookOpen size={16} /> {advert.label}</div>
            <h2>{advert.title}</h2>
            <p>{advert.text}</p>
            <Link to={advert.link} className="resyin-advert-link">{advert.action} <ExternalLink size={16} /></Link>
          </div>
          <div className="resyin-advert-controls">
            <button type="button" onClick={() => move(-1)} aria-label="Previous catalog highlight"><ArrowLeft size={17} /></button>
            <div className="resyin-advert-dots" aria-label="Select catalog highlight">
              {adverts.map((item, index) => (
                <button key={item.label} type="button" className={index === activeIndex ? "active" : ""} onClick={() => setActiveIndex(index)} aria-label={`Show ${item.label.toLowerCase()}`} />
              ))}
            </div>
            <button type="button" onClick={() => move(1)} aria-label="Next catalog highlight"><ArrowRight size={17} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
