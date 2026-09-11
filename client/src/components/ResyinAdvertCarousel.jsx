import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

const adverts = [
  {
    label: "FEATURED COLLECTION",
    title: "Ideas worth returning to.",
    text: "Selected books for thoughtful reading.",
    image: "/book-cover.png",
  },
  {
    label: "AUTHOR SPOTLIGHT",
    title: "A distinguished voice.",
    text: "Prof. Johnson A. Egonmwan in one collection.",
    image: "/prof.png",
  },
  {
    label: "FOR AUTHORS & PUBLISHERS",
    title: "Your next book, clearly positioned.",
    text: "Bring your title to readers and institutions.",
    image: "/let's learn about nigeria.png",
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
