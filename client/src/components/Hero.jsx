//client/src/components/Hero.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const heroImages = ["/book-cover.png", "/book-cover.png", "/book-cover.png", "/book-cover.png"];
const heroBodyText =
  "Discover books by Prof. Johnson A. Egonmwan and other authors. Explore scholarship, literature, and new perspectives.";

export default function Hero() {
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [prevImage, setPrevImage] = useState(null);
  const [slideDirection, setSlideDirection] = useState("right");
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      charIndex += 1;
      setTypedText(heroBodyText.slice(0, charIndex));
      if (charIndex >= heroBodyText.length) {
        clearInterval(typingInterval);
      }
    }, 40);

    return () => clearInterval(typingInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => {
        setPrevImage(prev);
        setSlideDirection((dir) => (dir === "left" ? "right" : "left"));
        return prev === heroImages.length - 1 ? 0 : prev + 1;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero">
      <div className="hero-background">
        {heroImages.map((src, index) => {
          const className =
            index === currentImage
              ? `hero-image-layer slide-in-${slideDirection}`
              : index === prevImage
              ? `hero-image-layer slide-out-${slideDirection}`
              : "hero-image-layer";

          return (
            <div
              key={src}
              className={className}
              style={{ backgroundImage: `url(${src})` }}
            />
          );
        })}
        <div className="hero-bg-overlay" />
      </div>

      <div className="hero-content">
        <h1 className={`hero-title slide-in-${slideDirection}`}>
          Discover your next remarkable book.
        </h1>

        <p className="hero-copy">{typedText || "\u00A0"}</p>

        <div>
          <button className="primary" onClick={() => navigate("/collection")}>
            Explore RESYIN
          </button>

          <button
            className="secondary"
            onClick={() => window.open("https://wa.me/2349041441646", "_blank")}
          >
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
