import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Library, Users, GraduationCap } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductGrid from "../components/ProductGrid";
import ResyinAdvertCarousel from "../components/ResyinAdvertCarousel";
import { getProducts } from "../services/api";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  useEffect(() => {
    let active = true;
    getProducts().then((data) => {
      if (!Array.isArray(data)) throw new Error("Invalid catalog");
      if (active) { setProducts(data.filter(Boolean)); setStatus("ready"); }
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, []);
  const featured = [...products].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured))).slice(0, 8);
  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))].slice(0, 6);
  return <><Navbar /><main className="bookstore-home">
    <div className="store-breadcrumb">Books &amp; ideas / The RESYIN bookstore</div>
    <section className="store-hero">
      <div className="store-hero-copy"><span className="store-eyebrow">THE AUTHOR SPOTLIGHT</span><h1>Ideas that stay.<br />Books that matter.</h1><p>Discover the books of <strong>Prof. Johnson A. Egonmwan</strong> ? and a growing home for authors, scholarship, and new perspectives.</p><Link className="store-primary" to="/collection?q=Egonmwan">Explore his books <ArrowRight size={18} /></Link><Link className="store-hero-link" to="/collection">Shop all books</Link></div>
      <div className="store-hero-art"><div className="store-orbit" /><img src="/let's learn about nigeria.png" alt="Let's Learn About Nigeria book cover" /><span className="store-art-caption">A new chapter starts here.</span></div>
    </section>
    <div className="store-benefits"><span><BookOpen size={20} /> A home for thoughtful reading</span><span><GraduationCap size={20} /> For study, work &amp; discovery</span><span><Users size={20} /> Established &amp; emerging voices</span></div>
    <ResyinAdvertCarousel />
    <section className="store-shelf"><div className="store-section-heading"><div><span className="store-eyebrow">YOUR NEXT GOOD READ</span><h2>Discover the collection</h2></div><Link to="/collection">See all books <ArrowRight size={16} /></Link></div>
      {status === "loading" ? <p role="status" className="store-empty">Loading the bookshelf?</p> : status === "error" ? <div className="store-empty" role="alert">We couldn?t load the books. <button onClick={() => window.location.reload()}>Try again</button></div> : featured.length ? <ProductGrid products={featured} /> : <div className="store-empty"><Library size={32} /><h3>Our next chapter is on its way</h3><p>New titles will appear here as they join the catalog.</p><Link to="/contact">Ask about a book</Link></div>}
    </section>
    {categories.length > 0 && <section className="store-shelf"><div className="store-section-heading"><h2>Shop by subject</h2><Link to="/collection">Browse all subjects</Link></div><div className="store-categories">{categories.map((category, i) => <Link key={category} to={`/collection?category=${encodeURIComponent(category)}`}><span>0{i + 1}</span><BookOpen size={28} /><h3>{category}</h3><span>Explore books ?</span></Link>)}</div></section>}
    <section className="store-author-banner"><div className="store-author-monogram" aria-hidden="true">JE</div><div><span className="store-eyebrow">MEET THE FEATURED AUTHOR</span><h2>Prof. Johnson A. Egonmwan</h2><p>Explore his work. Find your next perspective.</p><Link to="/collection?q=Egonmwan">Browse the author’s books ?</Link></div></section>
    <section className="store-publish"><div><span className="store-eyebrow">MORE VOICES. MORE POSSIBILITIES.</span><h2>Your book could be someone’s next discovery.</h2><p>Are you an author or publisher? Get in touch about adding your books to RESYIN.</p></div><Link className="store-secondary" to="/contact">Publish with us <ArrowRight size={18} /></Link></section>
    </main><Footer /></>;
}
