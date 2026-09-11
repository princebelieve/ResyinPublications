import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const purchaseSteps = [
  ["1", "Create an account", "Register or sign in so your cart, orders, and delivery updates stay connected to you."],
  ["2", "Choose your products", "Open Shop, select a product, choose the quantity, and add it to your cart."],
  ["3", "Review your cart", "Confirm quantities or remove anything you do not want before continuing to checkout."],
  ["4", "Choose delivery or pickup", "Delivery adds the applicable shipping fee. Pickup shows the collection location and removes shipping fees."],
  ["5", "Choose how to pay", "Pay securely online or choose the payment method shown for your order at checkout."],
  ["6", "Track your order", "Use My Orders in your dashboard to see payment and fulfilment updates after placing your order."],
];

const publisherSteps = [
  ["Prepare your book", "Gather the title, author and publisher details, description, cover image, ISBN, and the formats you want to offer."],
  ["Upload the formats", "Submit paperback, hardcover, PDF, or EPUB editions. Each format can have its own price, stock, ISBN, and SKU."],
  ["Submit for review", "RESYIN keeps new publisher submissions hidden while an administrator checks the book information and files."],
  ["Admin approval", "Once approved, the book becomes part of the RESYIN catalog and can be discovered by readers."],
  ["Reach readers", "Customers can purchase the physical editions or download the PDF/EPUB after a paid order is confirmed."],
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
