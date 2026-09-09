//client/src/pages/Cart.jsx
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";

import { useCart } from "../context/CartContext";
import { getShippingSummary } from "../services/api";

export default function Cart() {
  const navigate = useNavigate();
  const [deliveryInfo, setDeliveryInfo] = useState(null);

  const { cart, subtotal, removeFromCart, updateQuantity, clearCart, loading } =
    useCart();

  useEffect(() => {
    getShippingSummary("NG").then(setDeliveryInfo).catch(() => setDeliveryInfo(null));
  }, []);

  return (
    <>
      <Navbar />

      <div className="page">
        <h1>Your Cart</h1>

        {loading ? (
          <div className="cart-list">
            {[1, 2, 3].map((item) => (
              <div className="cart-item" key={item}>
                <div
                  style={{
                    width: 120,
                    height: 120,
                    background: "#e5e5e5",
                    borderRadius: 8,
                  }}
                />

                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      height: 20,
                      width: "60%",
                      background: "#e5e5e5",
                      borderRadius: 6,
                    }}
                  />

                  <div
                    style={{
                      height: 20,
                      width: "30%",
                      background: "#e5e5e5",
                      borderRadius: 6,
                    }}
                  />

                  <div
                    style={{
                      height: 40,
                      width: 140,
                      background: "#e5e5e5",
                      borderRadius: 6,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : cart.length === 0 ? (
          <div>
            <p>Your cart is empty.</p>

            <Link to="/collection">
              <button className="primary">Browse Collections</button>
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-list">
              {cart.map((item) => (
                <div className="cart-item" key={item.productId}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="cart-item-image"
                  />

                  <div className="cart-item-content">
                    <h3>{item.name}</h3>

                    <p>₦{Number(item.price).toLocaleString()}</p>

                    <div className="cart-actions">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1)
                        }
                      >
                        -
                      </button>

                      <input
                        type="number"
                        min="1"
                        inputMode="numeric"
                        aria-label={`Quantity for ${item.name}`}
                        value={item.quantity}
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          if (Number.isInteger(value) && value > 0) {
                            updateQuantity(item.productId, value);
                          }
                        }}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <p>
                Subtotal:
                <strong>₦{subtotal.toLocaleString()}</strong>
              </p>

              <p>
                Delivery:
                <strong>Calculated at checkout</strong>
              </p>
              {deliveryInfo?.estimatedDays && (
                <p>
                  Estimated delivery to Nigeria:
                  <strong>{deliveryInfo.estimatedDays}</strong>
                </p>
              )}

              <h2>Total: Based on checkout (includes shipping)</h2>

              <div
                style={{
                  display: "flex",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  className="primary"
                  onClick={() => navigate("/checkout")}
                >
                  Proceed To Checkout
                </button>

                <button type="button" className="btn-danger" onClick={clearCart}>
                  Clear Cart
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
