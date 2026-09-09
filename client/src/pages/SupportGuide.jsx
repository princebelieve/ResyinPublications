import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import supportKnowledge from "../config/supportKnowledge";

export default function SupportGuide() {
  return (
    <>
      <Navbar />
      <main className="support-guide">
        <section className="support-guide-hero">
          <div className="container support-guide-hero-grid">
            <div>
              <span className="eyebrow">RESYIN SUPPORT GUIDE</span>
              <h1>Clear answers for your reading journey.</h1>
              <p>
                Browse the RESYIN Publications guide for books, authors,
                publishing enquiries, accounts, orders, delivery, policies,
                and community support.
              </p>
            </div>
            <div className="support-guide-badge">
              <strong>GOOD BOOKS</strong>
              <span>KNOWLEDGE · COMMUNITY</span>
              <small>THE RESYIN</small>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="support-guide-intro">
              <span className="eyebrow">KNOWLEDGE CENTRE</span>
              <h2>Everything in one place.</h2>
              <p>
                Our support assistant uses this same local content to answer
                questions and point you to the right page. Information is
                maintained with the website and does not depend on an external
                AI provider.
              </p>
            </div>

            <div className="support-guide-grid">
              {supportKnowledge.map((entry) => (
                <article className="support-guide-card" key={entry.slug} id={entry.slug}>
                  <span className="support-guide-card-label">RESYIN GUIDE</span>
                  <h2>{entry.title}</h2>
                  <p className="support-guide-summary">{entry.summary}</p>
                  <ul>
                    {entry.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                  <a className="easy-text-link" href={entry.url}>
                    Open {entry.title} <span aria-hidden="true">-&gt;</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
