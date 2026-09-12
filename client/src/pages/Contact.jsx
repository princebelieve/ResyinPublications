import { createElement, useState } from "react";
import { ArrowRight, BookOpen, Building2, Mail, MessageCircle, Package, Send } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { submitInquiry } from "../services/api";
import useScrollReveal from "../hooks/useScrollReveal";

const contactTopics = [
  { icon: Package, title: "Book orders", text: "Ask about an order, availability, delivery, payment, or a damaged book." },
  { icon: Building2, title: "Schools and institutions", text: "Discuss library supply, classroom sets, bulk orders, and reading programmes." },
  { icon: BookOpen, title: "Authors and publishers", text: "Talk to the RESYIN team about listing a title or publishing partnership." },
];

export default function Contact() {
  useScrollReveal();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", projectType: "", message: "" });
  const [message, setMessage] = useState("");

  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await submitInquiry(form);
      setMessage("Your enquiry has been sent. The RESYIN team will respond shortly.");
      setForm({ fullName: "", email: "", phone: "", projectType: "", message: "" });
    } catch (error) {
      setMessage(error.message || "Your enquiry could not be sent. Please try again.");
    }
  }

  return (
    <>
      <Navbar />
      <main className="resyin-contact-page">
        <header className="resyin-contact-header">
          <div className="container resyin-contact-header-inner">
            <div>
              <p className="resyin-contact-kicker">RESYIN PUBLICATIONS / CONTACT</p>
              <h1>How can we help?</h1>
              <p className="resyin-contact-lede">Get help with a book order, ask about institutional purchasing, or start a conversation about bringing a new title to the RESYIN catalog.</p>
            </div>
            <div className="resyin-contact-reference" aria-label="RESYIN contact reference">
              <span>Customer support</span>
              <strong>RESYIN-01</strong>
              <small>Keep your order number nearby for faster help.</small>
            </div>
          </div>
        </header>

        <section className="resyin-contact-content section">
          <div className="container">
            <div className="resyin-contact-topics">
              {contactTopics.map(({ icon, title, text }) => (
                <article className="resyin-contact-topic" key={title}>
                  {createElement(icon, { size: 21, "aria-hidden": true })}
                  <h2>{title}</h2>
                  <p>{text}</p>
                  <ArrowRight size={17} aria-hidden="true" />
                </article>
              ))}
            </div>

            <div className="resyin-contact-grid">
              <section className="resyin-contact-form-panel">
                <p className="resyin-contact-kicker">SEND A MESSAGE</p>
                <h2>Tell us what you need.</h2>
                <form className="resyin-contact-form" onSubmit={submit}>
                  <label>Name<input required name="fullName" value={form.fullName} onChange={change} autoComplete="name" /></label>
                  <label>Email address<input required type="email" name="email" value={form.email} onChange={change} autoComplete="email" /></label>
                  <label>Phone or WhatsApp<input required name="phone" value={form.phone} onChange={change} autoComplete="tel" /></label>
                  <label>Topic<select required name="projectType" value={form.projectType} onChange={change}><option value="">Choose a topic</option><option>Book order or delivery</option><option>School or library order</option><option>Author or publisher enquiry</option><option>Digital book support</option><option>General enquiry</option></select></label>
                  <label className="resyin-contact-form-wide">Message<textarea required name="message" rows="6" value={form.message} onChange={change} placeholder="Include an order number, book title, or a short description of your enquiry." /></label>
                  <button className="resyin-contact-submit" type="submit"><Send size={17} /> Send enquiry</button>
                  {message && <p className="resyin-contact-status" role="status">{message}</p>}
                </form>
              </section>

              <aside className="resyin-contact-aside">
                <div>
                  <p className="resyin-contact-kicker">DIRECT CHANNELS</p>
                  <h2>Reach the bookstore.</h2>
                  <a href="mailto:info@resyinpublications.com"><Mail size={18} /> info@resyinpublications.com</a>
                  <a href="https://wa.me/2349041441646" target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp support</a>
                  <a href="tel:+2349041441646"><Package size={18} /> +234 904 144 1646</a>
                </div>
                <div className="resyin-contact-note"><strong>For authors</strong><p>Include your name, title, format, ISBN if available, and a short note about the audience for your book.</p></div>
                <div className="resyin-contact-note"><strong>For institutions</strong><p>Tell us the titles, quantities, delivery location, and preferred timeline for your order.</p></div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
