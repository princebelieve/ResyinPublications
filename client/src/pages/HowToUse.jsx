import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const purchaseSteps = [
  ["1", "Create an account", "Register or sign in so your cart, orders, and delivery updates stay connected to your RESYIN account."],
  ["2", "Choose your books", "Browse the RESYIN catalog, select a title, choose the edition you want, and add it to your cart."],
  ["3", "Review your order", "Check quantities, remove anything you do not want, and confirm the details before checkout."],
  ["4", "Choose delivery or pickup", "Delivery adds the relevant shipping fee. Pickup shows the collection point and skips delivery charges."],
  ["5", "Choose how to pay", "Pay securely online or choose the payment method shown for your order at checkout."],
  ["6", "Track your order", "Use My Orders in your dashboard to follow payment status, fulfilment, and delivery updates."],
];

const publisherSteps = [
  ["Prepare your book", "Gather the title, author, publisher details, description, cover image, ISBN if available, and the editions you want to offer."],
  ["Upload the formats", "Submit paperback, hardcover, PDF, or EPUB editions. Each format can have its own price, stock, ISBN, and auto-generated SKU."],
  ["Submit for review", "RESYIN keeps new publisher submissions private while an administrator reviews the book details and files."],
  ["Admin approval", "Once approved, the book becomes part of the RESYIN catalog and is available to readers in the bookstore."],
  ["Reach readers", "Customers can purchase physical editions or download the approved PDF/EPUB after payment is confirmed."],
];

export default function HowToUse() {
  return (
    <>
      <Navbar />
      <main className="how-to-use-page">
        <section className="how-to-use-hero">
          <div className="container">
            <span className="eyebrow">RESYIN APP GUIDE</span>
            <h1>Shop with confidence. Publish with RESYIN.</h1>
            <p>A straightforward guide to buying books and submitting paperback, hardcover, PDF, or EPUB editions for review.</p>
            <div className="easy-actions">
              <Link className="easy-btn easy-btn-primary" to="/collection">Start shopping</Link>
              <Link className="easy-btn easy-btn-light" to="/dashboard">Open my dashboard</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="how-to-use-heading">
              <span className="eyebrow">FOR CUSTOMERS</span>
              <h2>How to make a purchase</h2>
              <p>Checkout is designed to let you review your order before payment and choose the fulfilment method that works for you.</p>
            </div>
            <div className="how-to-use-steps">
              {purchaseSteps.map(([number, title, description]) => <article className="how-to-use-step content-card" key={number}><span>{number}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}
            </div>
          </div>
        </section>

        <section className="how-to-use-payment">
          <div className="container how-to-use-payment-grid">
            <div><span className="eyebrow">CHECKOUT EXPLAINED</span><h2>Delivery, pickup, and payment choices</h2></div>
            <div className="how-to-use-payment-list">
              <p><strong>Delivery:</strong> Enter your delivery address and the shipping fee is included before payment.</p>
              <p><strong>Pickup:</strong> Select pickup to skip shipping charges. The checkout page shows the collection location after your order is confirmed.</p>
              <p><strong>Online payment:</strong> Complete payment securely through Paystack.</p>
              <p><strong>Pay on delivery / pickup:</strong> Available according to the checkout conditions shown for your order.</p>
              <p><strong>Digital books:</strong> PDF and EPUB downloads become available after a paid order is confirmed.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="how-to-use-heading">
              <span className="eyebrow">FOR AUTHORS &amp; PUBLISHERS</span>
              <h2>How publishing with RESYIN works</h2>
              <p>Submit a complete book package, wait for review, and make approved editions available to readers.</p>
            </div>
            <div className="how-to-use-steps">
              {publisherSteps.map(([title, description], index) => <article className="how-to-use-step content-card" key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}
            </div>
            <aside className="how-to-use-note"><strong>Important:</strong> New publisher books remain hidden until an administrator approves the submission.</aside>
          </div>
        </section>

        <section className="how-to-use-help">
          <div className="container"><h2>Need help with an order or a book submission?</h2><p>Our support guide and team can help you with orders, pickup, delivery, payment, or new publisher submissions.</p><div className="easy-actions"><Link className="easy-btn easy-btn-primary" to="/support">Open support guide</Link><Link className="easy-btn easy-btn-light" to="/contact">Contact RESYIN</Link></div></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
