import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getTestimonials } from "../services/api";
import { setMetaTags } from "../utils/metaTags";
import useScrollReveal from "../hooks/useScrollReveal";
import PostShareButton from "../components/PostShareButton";
import { getVideoEmbedUrl } from "../utils/videoEmbed";

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  useScrollReveal();

  useEffect(() => {
    setMetaTags({
      title: "RESYIN Testimonials | Real Reading Journeys",
      description: "Hear real RESYIN Publications stories, reading journeys, and community experiences through video and written testimonials.",
      url: `${window.location.origin}/testimonials`,
    });
    getTestimonials().then((data) => setTestimonials(Array.isArray(data) ? data.map((item) => ({ ...item, videoFile: item.videoFile || item.video || "", audioFile: item.audioFile || item.audio || "" })) : [])).catch(() => setTestimonials([]));
  }, []);

  return <><Navbar /><main className="testimonials-page"><section className="testimonials-hero reveal"><div className="container"><span className="eyebrow">REAL PEOPLE. REAL RESULTS.</span><h1>Stories from the RESYIN community.</h1><p>Explore reading journeys, personal growth, and community experiences shared by people connected to RESYIN Publications.</p></div></section><section className="section"><div className="container"><div className="testimonials-grid">{testimonials.map((item) => { const embedUrl = getVideoEmbedUrl(item.videoUrl); return <article className="testimonial-card content-card" key={item._id}>{(item.videoFile || item.audioFile || embedUrl || item.image) && <div className="testimonial-media">{item.videoFile ? <video controls preload="metadata" poster={item.image || undefined} src={item.videoFile} /> : item.audioFile ? <audio controls preload="metadata" src={item.audioFile} /> : embedUrl ? <iframe title={`${item.name} testimonial video`} src={embedUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <img src={item.image} alt={item.name} />}</div>}<div className="testimonial-body"><p className="testimonial-quote">“{item.testimony}”</p><h2>{item.name}</h2>{item.role && <span>{item.role}</span>}<PostShareButton title={item.title || item.name} text={item.testimony} url={`${window.location.origin}/testimonials#${item._id}`} /></div></article>; })}</div>{!testimonials.length && <div className="empty-state"><h2>Stories are being prepared.</h2><p>Check back soon for RESYIN community experiences.</p></div>}</div></section></main><Footer /></>;
}
