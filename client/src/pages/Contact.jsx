import { useState } from "react";
import { Mail, Phone, MessageCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { submitInquiry } from "../services/api";
import useScrollReveal from "../hooks/useScrollReveal";

export default function Contact() {
  useScrollReveal();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", projectType: "", message: "" });
  const [message, setMessage] = useState("");
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  async function submit(event) {
    event.preventDefault();
    try {
      await submitInquiry(form);
      setMessage("Thank you. RESYIN will get in touch shortly.");
      setForm({ fullName: "", email: "", phone: "", projectType: "", message: "" });
    } catch (error) {
      setMessage(error.message || "Your enquiry could not be sent.");
    }
  }

  return <><Navbar /><main className="contact-page"><section className="contact-hero reveal"><div className="container contact-hero-card"><div className="contact-copy"><span className="eyebrow">CONTACT RESYIN PUBLICATIONS</span><h1>Let’s take the next step together.</h1><p>Ask about book orders, Prof. Johnson A. Egonmwan’s titles, publishing your work, or school and library purchases.</p><div className="contact-strip"><a href="https://wa.me/2349041441646" target="_blank" rel="noreferrer" className="strip-card whatsapp-card"><MessageCircle size={28} /><div><strong>Chat on WhatsApp</strong><span>+2349041441646</span></div></a><a href="tel:+2349041441646" className="strip-card email-card"><Phone size={28} /><div><strong>Call RESYIN</strong><span>+2349041441646</span></div></a></div></div></div></section><section className="section reveal"><div className="container about-story"><div className="story-card reveal"><h2 className="title">Send an enquiry</h2><form className="form" onSubmit={submit}><input required name="fullName" placeholder="Full name" value={form.fullName} onChange={change} /><input required type="email" name="email" placeholder="Email address" value={form.email} onChange={change} /><input required name="phone" placeholder="Phone / WhatsApp number" value={form.phone} onChange={change} /><select required name="projectType" value={form.projectType} onChange={change}><option value="">What can we help with?</option><option>Books</option><option>Publish my book</option><option>School or library order</option><option>Community outreach</option><option>Partnership opportunity</option><option>General enquiry</option></select><textarea required name="message" rows="5" placeholder="Tell us how we can help." value={form.message} onChange={change} /><button className="primary">Send enquiry</button>{message && <p>{message}</p>}</form></div><div className="story-card reveal"><Mail size={30} /><h2 className="title">Contact the bookstore</h2><p><a href="https://resyinpublications.com">resyinpublications.com</a></p><p><a href="mailto:info@resyinpublications.com">info@resyinpublications.com</a></p>{["2349041441646", "2348034621513"].map((number) => <div key={number} className="contact-address"><strong>+{number}</strong><p><a href={`tel:+${number}`}>Call</a> &middot; <a href={`https://wa.me/${number}`} target="_blank" rel="noreferrer">WhatsApp</a></p></div>)}<p>For collection or delivery arrangements, please contact us before visiting.</p></div></div></section></main><Footer /></>;
}
