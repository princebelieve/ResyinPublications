import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const purchaseSteps = [
  ["1", "Create an account", "Register or sign in so your cart, orders, and delivery updates stay connected to you."],
  ["2", "Choose your products", "Open Shop, select a product, choose the quantity, and add it to your cart."],
  ["3", "Review your cart", "Confirm quantities or remove anything you do not want before continuing to checkout."],
  ["4", "Choose delivery or pickup", "Delivery adds the applicable shipping fee. Pickup shows the collection location and removes shipping fees."],
  ["5", "Choose how to pay", "Pay securely online, pay on delivery where available, or use the distributor transfer option when shopping through a distributor."],
  ["6", "Track your order", "Use My Orders in your dashboard to see payment and fulfilment updates after placing your order."],
];

const distributorSteps = [
  ["Apply", "Open your dashboard and choose Apply to become a distributor. Enter your business, phone, pickup address, bank account, and delivery details."],
  ["Wait for approval", "An RESYIN administrator reviews your application. Your distributor dashboard is available only after approval."],
  ["Buy stock", "Use the Distributor Dashboard wholesale catalogue to buy eligible products at distributor prices. Approved payment adds the items to your distributor stock."],
  ["Share your shop", "Your dashboard provides a personal shop link. Customers who use it see products you have in stock and your fulfilment options."],
  ["Fulfil customer orders", "Set your account details, pickup address, and delivery availability. Customers can pay by transfer to your listed account where enabled."],
  ["Keep stock accurate", "Record direct sales in your dashboard. Customer orders from your distributor shop also reduce your available stock after payment confirmation."],
];

export default function HowToUse() {
  return (
    <>
      <Navbar />
      <main className="how-to-use-page">
        <section className="how-to-use-hero">
          <div className="container">
            <span className="eyebrow">RESYIN APP GUIDE</span>
            <h1>Shop with confidence. Grow as a distributor.</h1>
            <p>A straightforward guide to buying products, choosing fulfilment and payment, and running a RESYIN distributor shop.</p>
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
              <p><strong>Distributor transfer:</strong> When you use a distributor’s link, their verified account details appear as an available payment option.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="how-to-use-heading">
              <span className="eyebrow">FOR DISTRIBUTORS</span>
              <h2>How the distributor role works</h2>
              <p>Distributors buy their own stock at the approved distributor price, then serve customers through a controlled personal shop link.</p>
            </div>
            <div className="how-to-use-steps distributor-how-to-steps">
              {distributorSteps.map(([title, description], index) => <article className="how-to-use-step content-card" key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></article>)}
            </div>
            <aside className="how-to-use-note"><strong>Important:</strong> Distributor stock and regular RESYIN stock are separate. Only products in a distributor’s available stock appear through that distributor’s personal link.</aside>
          </div>
        </section>

        <section className="how-to-use-help">
          <div className="container"><h2>Need help with an order or application?</h2><p>Our support guide and team can help you with orders, pickup, delivery, payment, or distributor applications.</p><div className="easy-actions"><Link className="easy-btn easy-btn-primary" to="/support">Open support guide</Link><Link className="easy-btn easy-btn-light" to="/contact">Contact RESYIN</Link></div></div>
        </section>
      </main>
      <Footer />
    </>
  );
}
