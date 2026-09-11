import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useScrollReveal from "../hooks/useScrollReveal";

export default function AuthorProfile() {
  useScrollReveal();

  return (
    <>
      <Navbar />
      <main className="page author-profile-page">
        <section className="about-hero reveal">
          <div className="container about-hero-grid">
            <div className="about-copy">
              <span className="eyebrow">FEATURED AUTHOR</span>
              <h1>Dr. Johnson Agharese Egonmwan</h1>
              <p>
                Retired professor, author, and public-interest researcher whose
                work examines governance, public policy, and development in Nigeria.
              </p>
              <Link className="easy-btn easy-btn-primary" to="/collection?q=Egonmwan">
                Browse his books
              </Link>
            </div>
            <div className="about-image-wrap hover-lift easy-about-mark">
              <img src="/book-cover.png" alt="A book by Dr. Johnson Agharese Egonmwan" />
              <div className="easy-about-badge">
                <span>AUTHOR PROFILE</span>
                <strong>BOOKS<br />IDEAS</strong>
                <small>RESYIN PUBLICATIONS</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section reveal">
          <div className="container about-story">
            <div className="story-card hover-lift">
              <h2 className="title">About the author</h2>
              <p className="muted">
                Dr. Johnson Agharese Egonmwan has more than three decades of
                experience in fact-checking, investigative authorship, and
                public-interest reporting. His evidence-based research promotes
                transparency, good governance, and accountability.
              </p>
            </div>
            <div className="story-card hover-lift">
              <h2 className="title">Areas of work</h2>
              <ul className="promise-list">
                <li>Public policy and public administration</li>
                <li>Development economics and governance</li>
                <li>Leadership and institutional accountability</li>
                <li>Evidence-based research on Nigeria and development</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section-alt reveal">
          <div className="container values-header">
            <span className="eyebrow">THE AUTHOR'S BOOKS</span>
            <h2 className="title">Explore his work</h2>
            <p className="muted">Discover books by Dr. Egonmwan in the RESYIN Publications catalog.</p>
            <Link className="easy-btn easy-btn-primary" to="/collection?q=Egonmwan">
              View the author collection
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
