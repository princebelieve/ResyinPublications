import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useScrollReveal from "../hooks/useScrollReveal";

const authorHighlights = [
  "Governance and institutional reform",
  "Public policy and development administration",
  "Monitoring, evaluation and capacity building",
  "Evidence-based leadership and innovation",
];

export default function AuthorProfile() {
  useScrollReveal();

  return (
    <>
      <Navbar />
      <main className="page author-profile-page">
        <section className="about-hero reveal">
          <div className="container about-hero-grid author-profile-hero">
            <div className="about-copy">
              <span className="eyebrow">FOUNDER &amp; PUBLISHER</span>
              <h1>Prof. Johnson Agharese Egonmwan</h1>
              <p>
                Distinguished scholar, development policy expert, public administrator,
                author, and founder of RESYIN Publications. He has spent decades championing
                informed writing, public accountability, and the power of ideas to shape societies.
                He is also a respected speaker at national and international conferences.
              </p>
              <div className="author-cta-row">
                <Link className="easy-btn easy-btn-primary" to="/collection?q=Egonmwan">
                  Browse his books
                </Link>
                <Link className="easy-btn easy-btn-light" to="/about">
                  About RESYIN
                </Link>
              </div>
            </div>

            <div className="author-profile-photo-wrap hover-lift">
              <img src="/prof.png" alt="Prof. Johnson Agharese Egonmwan" />
              <div className="author-badge-card">
                <span>PROFILE</span>
                <strong>PUBLIC<br />POLICY</strong>
                <small>AFRICA &amp; BEYOND</small>
              </div>
            </div>
          </div>
        </section>

        <section className="section reveal">
          <div className="container author-profile-layout">
            <div className="story-card hover-lift author-story-card">
              <h2 className="title">About Prof. Egonmwan</h2>
              <p className="muted">
                He holds a B.Sc. (Hons.) in Sociology from the University of Lagos, a Master’s
                Degree in Development Studies from the International Institute of Social Studies,
                The Hague, and the Doctoraal Degree from the Free University of Amsterdam. He also
                earned a Certificate in Public Financial Management from Harvard Kennedy School.
              </p>
            </div>

            <div className="story-card hover-lift author-story-card">
              <h2 className="title">Profile highlights</h2>
              <ul className="promise-list author-highlights">
                {authorHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="section reveal">
          <div className="container author-feature-block">
            <div className="story-card hover-lift author-story-card author-wide-card">
              <h2 className="title">Leadership and consulting</h2>
              <p className="muted">
                Prof. Egonmwan has served as State Director of Planning and Budget and as Permanent
                Secretary/Director-General in the Ministry of Finance, Commerce and Industry, Edo State.
                He has also worked as an international consultant for the World Bank, UNDP, UNICEF,
                WHO, the European Union Delegation, and the UK Department for International Development,
                supporting work in public financial management, governance reform, monitoring and
                evaluation, and capacity building.
              </p>
            </div>
          </div>
        </section>

        <section className="section reveal">
          <div className="container author-feature-block">
            <div className="story-card hover-lift author-story-card author-wide-card">
              <h2 className="title">Founder’s mission</h2>
              <p className="muted">
                As the founder of RESYIN Publications, Prof. Johnson Agharese Egonmwan created the
                platform to give thoughtful voices a place to be heard, ideas a place to be shared,
                and knowledge a place to shape society. He believes publishing is not only about books,
                but about helping others make their voices heard, contribute meaningfully to public
                life, and leave a lasting impact through informed writing and dialogue.
              </p>
            </div>
          </div>
        </section>

        <section className="section-alt reveal">
          <div className="container author-feature-block">
            <div className="values-header author-values-header">
              <span className="eyebrow">SCHOLARSHIP &amp; IMPACT</span>
              <h2 className="title">A prolific voice in development practice and policy</h2>
              <p className="muted">
                A respected author, speaker, and mentor, Prof. Egonmwan writes on governance,
                public administration, leadership, economics, anti-corruption, and artificial
                intelligence in public systems and sustainable development.
              </p>
            </div>

            <div className="author-quote-card">
              <p>
                “Good governance, institutional excellence, innovation, and inclusive development
                remain the foundations of progress across Africa and beyond.”
              </p>
            </div>

            <div className="author-action-row">
              <Link className="easy-btn easy-btn-primary" to="/collection?q=Egonmwan">
                Explore his books
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
