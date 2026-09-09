import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useScrollReveal from "../hooks/useScrollReveal";
import { ArrowRight, HeartHandshake, Users } from "lucide-react";

const activities = [
  { title: "Reading communities", text: "Contact us about books for schools, libraries, reading groups, and community learning.", image: "/book-cover.png" },
  { title: "Author and book events", text: "Discuss an author event, book presentation, or reading activity with our team.", image: "/book-cover.png" },
  { title: "Partnership and impact", text: "Organizations can work with RESYIN to sponsor learning, support local initiatives, and create practical opportunities.", image: "/book-cover.png" },
];

export default function Outreach() {
  useScrollReveal();
  return <><Navbar /><main className="outreach-page"><section className="outreach-hero reveal"><div className="container outreach-hero-grid"><div><span className="eyebrow">RESYIN COMMUNITY IMPACT</span><h1>Bringing books and communities together.</h1><p>We welcome enquiries about reading initiatives, school and library orders, author events, and publishing partnerships.</p><div className="easy-actions"><Link className="easy-btn easy-btn-primary breathing-button" to="/contact">Plan an outreach <ArrowRight size={18} /></Link><Link className="easy-btn easy-btn-light breathing-button" to="/testimonials">See community stories</Link></div></div><img className="breathing-image" src="/book-cover.png" alt="RESYIN Publications community team" /></div></section><section className="section reveal"><div className="container"><div className="easy-section-heading"><span className="eyebrow">WHAT WE DO</span><h2>Outreach that turns good intentions into useful action.</h2></div><div className="outreach-grid">{activities.map((activity) => <article className="outreach-card content-card" key={activity.title}><img src={activity.image} alt={activity.title} /><div><h2>{activity.title}</h2><p>{activity.text}</p></div></article>)}</div></div></section><section className="outreach-commitment reveal"><div className="container outreach-commitment-grid"><HeartHandshake size={48} /><div><span className="eyebrow">PARTNERS WELCOME</span><h2>Bring your people, purpose, and ideas.</h2><p>Schools, churches, NGOs, companies, authors and publishers, and community associations can contact us to discuss a learning event, sponsorship, book showcase, or partnership.</p><Link className="easy-text-link" to="/contact">Discuss a partnership <ArrowRight size={17} /></Link></div><Users size={48} /></div></section></main><Footer /></>;
}
