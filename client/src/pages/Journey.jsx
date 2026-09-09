import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useScrollReveal from "../hooks/useScrollReveal";
import { ArrowRight, BookOpen, Library, Users } from "lucide-react";

const milestones = [
  { year: "01", title: "Find your next book", text: "Browse by title, author, or subject to find a book that speaks to your interests.", icon: Library },
  { year: "02", title: "Build knowledge and confidence", text: "Explore ideas through academic, professional, literary, and general-interest books.", icon: Users },
  { year: "03", title: "Create meaningful impact", text: "Share what you read and introduce others to authors and ideas.", icon: BookOpen },
];

export default function Journey() {
  useScrollReveal();
  return <><Navbar /><main className="journey-page"><section className="journey-hero reveal"><div className="container journey-hero-grid"><div><span className="eyebrow">THE RESYIN JOURNEY</span><h1>Open a book. Discover a perspective.</h1><p>Every reading journey begins with curiosity. Discover Prof. Johnson A. Egonmwan’s work and explore a growing catalog of authors.</p><Link className="easy-btn easy-btn-primary breathing-button" to="/register">Start your journey <ArrowRight size={18} /></Link></div><img className="breathing-image" src="/book-cover.png" alt="Discover books with RESYIN" /></div></section><section className="section reveal"><div className="container"><div className="easy-section-heading"><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>Progress is built one meaningful step at a time.</h2></div><div className="journey-milestones">{milestones.map(({ year, title, text, icon: _Icon }) => <article className="journey-card content-card" key={year}><span className="journey-number">{year}</span><_Icon size={30} /><h2>{title}</h2><p>{text}</p></article>)}</div></div></section><section className="journey-stories reveal"><div className="container journey-stories-grid"><div><span className="eyebrow">REAL PEOPLE. REAL RESULTS.</span><h2>Stories make the journey visible.</h2><p>Read and watch experiences from readers discovering books and sharing new perspectives with RESYIN Publications.</p><Link className="easy-btn easy-btn-primary breathing-button" to="/testimonials">Explore stories <ArrowRight size={18} /></Link></div><img className="breathing-image" src="/book-cover.png" alt="RESYIN community members sharing a journey" /></div></section></main><Footer /></>;
}
