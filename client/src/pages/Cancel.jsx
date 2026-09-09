//client/src/pages/Cancel.jsx
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Cancel() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const reference = searchParams.get("reference");

  return (
    <>
      <Navbar />
      <div
        className="page"
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <div className="cart-summary">
          <h1 style={{ fontSize: "2.5em", margin: "0 0 10px 0" }}>
            ❌ Payment Cancelled
          </h1>

          <p
            style={{
              fontSize: "1.1em",
              color: "#666",
              margin: "10px 0 20px 0",
            }}
          >
            Your payment was cancelled. No charges were made to your account.
          </p>

          <p style={{ color: "#999", marginBottom: 30 }}>
            You can review your cart and try again, or continue shopping.
          </p>

          {reference && (
            <div
              style={{
                padding: "10px",
                backgroundColor: "#f5f5f5",
                borderRadius: 4,
                marginBottom: 20,
                fontSize: "0.85em",
                color: "#999",
              }}
            >
              <p style={{ margin: 0 }}>
                Payment Reference: <code>{reference}</code>
              </p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: 30,
            }}
          >
            <button className="primary" onClick={() => navigate("/checkout")}>
              Return to Checkout
            </button>

            <Link to="/collection">
              <button>Continue Shopping</button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
