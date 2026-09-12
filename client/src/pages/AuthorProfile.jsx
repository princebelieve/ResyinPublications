import { Link } from "react-router-dom";
import { FaAmazon, FaFacebook, FaNewspaper } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import useScrollReveal from "../hooks/useScrollReveal";

const authorHighlights = [
  "Governance and institutional reform",
  "Public policy and development administration",
  "Monitoring, evaluation and capacity building",
  "Evidence-based leadership and innovation",
];

const authorSocialLinks = [
  {
    label: "Resyin on Facebook",
    href: "https://www.facebook.com/resyincoinc/",
    icon: FaFacebook,
  },
  {
    label: "Johnson Egonmwan on Amazon",
    href: "https://www.amazon.com/Johnson-Egonmwan/e/B07WYVHVL1",
    icon: FaAmazon,
  },
];

const authorReferences = [
  {
    label: "The Nation review",
    href: "https://thenationonlineng.net/a-phenomenal-treatise/",
    icon: FaNewspaper,
    text: "A review of Rich Nation, Poor People that identifies Prof. Egonmwan as its author and RESYIN Publications as publisher.",
  },
  {
    label: "Amazon author profile",
    href: "https://www.amazon.com/Johnson-Egonmwan/e/B07WYVHVL1",
    icon: FaAmazon,
    text: "His public author page lists his books and describes his public-administration and international consulting experience.",
  },
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
                His published work and professional experience connect public administration,
                development, governance, and institutional reform.
              </p>
              <div className="author-cta-row">
                <Link className="easy-btn easy-btn-primary" to="/collection?q=Egonmwan">
                  Browse his books
                </Link>
                <Link className="easy-btn easy-btn-light" to="/about">
                  About RESYIN
                </Link>
              </div>
              <div className="author-social-links" aria-label="Author profiles and social links">
                <span>Connect with Prof. Egonmwan</span>
                <div>
                  {authorSocialLinks.map(({ label, href, icon: Icon }) => (
                    <a
                      key={href}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      title={label}
                    >
                      <Icon size={20} aria-hidden="true" />
                    </a>
                  ))}
                </div>
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
                He has also worked as an independent specialist consultant for the World Bank, UNDP,
                the European Union, and the UK Department for International Development, supporting
                work in public financial management, governance reform, monitoring and evaluation,
                and capacity building. Amazon describes him as the coordinating consultant and CEO
                of Resyin Consults (Nigeria) Inc.
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

        <section className="section reveal">
          <div className="container author-references-block">
            <div className="values-header author-values-header">
              <span className="eyebrow">PUBLIC REFERENCES</span>
              <h2 className="title">Read the sources behind this profile</h2>
              <p className="muted">
                These public pages provide context about his books, publishing work, professional
                background, and consulting experience.
              </p>
            </div>
            <div className="author-reference-grid">
              {authorReferences.map(({ label, href, icon: Icon, text }) => (
                <a className="author-reference-card" href={href} key={href} target="_blank" rel="noreferrer">
                  <span className="author-reference-icon" aria-hidden="true"><Icon size={21} /></span>
                  <span>
                    <strong>{label}</strong>
                    <small>{text}</small>
                    <em>Open reference</em>
                  </span>
                </a>
              ))}
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
