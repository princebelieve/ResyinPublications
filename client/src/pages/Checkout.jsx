//client/src/pages/Checkout.jsx
import { useEffect, useState } from "react";
import { getNigerianDeliveryStates, getPublicStorePaymentSettings, getShippingDestinations, getTransportCompanies, initializeCheckout, previewShipping } from "../services/api";
import Navbar from "../components/Navbar";
import { useCart } from "../context/CartContext";
const COUNTRY_NAMES = new Intl.DisplayNames(["en"], { type: "region" });

export default function Checkout() {
  const { cart, subtotal, clearCart, removeFromCart } = useCart();
  const publisherIds = [...new Set(cart.map((item) => item.publisherId).filter(Boolean))];
  const hasPublisherBooks = publisherIds.length > 0;
  const canPayPublisherDirectly = publisherIds.length === 1 && cart.every((item) => item.publisherId);
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingInfo, setShippingInfo] = useState(null);
  const [shippingDestinations, setShippingDestinations] = useState(["NG"]);
  const [nigerianStates, setNigerianStates] = useState([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [shippingError, setShippingError] = useState("");
  const [storePaymentSettings, setStorePaymentSettings] = useState(null);
  const [transportCompanies, setTransportCompanies] = useState([]);

  const totalAmount = subtotal + shippingFee;
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "NG",
    notes: "",
    paymentMethod: hasPublisherBooks ? "publisher_direct_transfer" : "paystack",
    deliveryMethod: "delivery",
    pickupTransportCompany: "",
    pickupOtherLocation: "",
  });

  useEffect(() => {
    if (hasPublisherBooks && canPayPublisherDirectly) {
      setForm((current) => ({ ...current, paymentMethod: "publisher_direct_transfer" }));
    }
  }, [hasPublisherBooks, canPayPublisherDirectly]);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "country" && value !== "NG" ? { paymentMethod: "paystack" } : {}),
    }));

  }

  async function removeCheckoutItem(productId, editionKey) {
    setCheckoutError("");
    await removeFromCart(productId, editionKey);
  }

  useEffect(() => {
    getShippingDestinations()
      .then((destinations) => {
        setShippingDestinations(destinations);
        setForm((current) => destinations.includes(current.country) ? current : { ...current, country: destinations[0] || "NG" });
      })
      .catch(() => setShippingDestinations(["NG"]));
  }, []);

  useEffect(() => {
    if (!form.state) { setTransportCompanies([]); return; }
    getTransportCompanies(form.state).then(setTransportCompanies).catch(() => setTransportCompanies([]));
  }, [form.state]);

  useEffect(() => {
    getNigerianDeliveryStates()
      .then((rates) => setNigerianStates(rates.map((rate) => rate.state)))
      .catch(() => setNigerianStates([]));
  }, []);

  useEffect(() => {
    getPublicStorePaymentSettings().then(setStorePaymentSettings).catch(() => setStorePaymentSettings(null));
  }, []);

  useEffect(() => {
    async function loadShipping() {
      try {
        if (form.deliveryMethod === "pickup") {
          setShippingError("");
          setShippingFee(0);
          setShippingInfo({ serviceName: "Pickup", estimatedDays: "Ready after confirmation" });
          return;
        }
        if (!form.country) {
          setShippingError("");
          setShippingFee(0);
          setShippingInfo(null);
          return;
        }

        const data = await previewShipping({
          country: form.country,
          state: form.state,
          items: cart,
        });

        setShippingError("");
        setShippingFee(Number(data.shippingFee || 0));
        setShippingInfo(data);
      } catch (err) {
        console.error(err);
        setShippingError(
          err.message || "Unable to verify delivery availability.",
        );
        setShippingFee(0);
        setShippingInfo(null);
      }
    }

    loadShipping();
  }, [form.country, form.state, form.deliveryMethod, cart]);

  async function handleCheckout(e) {
    e.preventDefault();
    setCheckoutError("");
    setCheckoutLoading(true);

    try {
      const response = await initializeCheckout({
        ...form,
      });

      if (["cash_on_delivery", "manual_bank_transfer", "publisher_direct_transfer"].includes(response.checkoutType)) {
        await clearCart();
        window.location.href = response.confirmation_url;
        return;
      }

      window.location.href = response.authorization_url;
    } catch (err) {
      console.error(err);

      setCheckoutError(err.message || "Unable to initialize checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="page">
        <h1>Checkout</h1>

        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <div className="checkout-layout">
            <form className="form" onSubmit={handleCheckout}>
              <input
                name="customerName"
                placeholder="Full Name"
                value={form.customerName}
                onChange={handleChange}
                required
              />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                name="phone"
                placeholder="Phone Number"
                value={form.phone}
                onChange={handleChange}
                required
              />

              <fieldset className="payment-methods checkout-fulfilment-methods">
                <legend>How would you like to receive your order?</legend>
                <p className="checkout-fulfilment-help">Delivery goes to a delivery partner or collection park in your selected state; customers collect from there. Office pickup is only for customers coming to RESYIN in Benin City.</p>
                <label className="payment-method-option"><input type="radio" name="deliveryMethod" value="delivery" checked={form.deliveryMethod === "delivery"} onChange={handleChange} /><span><strong>Delivery</strong><small>RESYIN will arrange delivery.</small></span></label>
                <label className="payment-method-option"><input type="radio" name="deliveryMethod" value="pickup" checked={form.deliveryMethod === "pickup"} onChange={handleChange} /><span><strong>Pick up — no shipping fee</strong><small>Pick up from RESYIN Publications after confirmation.</small></span></label>
              </fieldset>

              {form.deliveryMethod === "delivery" ? (
                <>
                  <label className="checkout-address-label">Your address or nearest landmark <span>Used only to choose the closest delivery partner or collection park in your state. We do not deliver to your doorstep.</span><input name="address" placeholder="House address, street, community, or nearest landmark" value={form.address} onChange={handleChange} required /></label>
                  <select name="country" value={form.country} onChange={handleChange} required>
                    {shippingDestinations.map((country) => <option key={country} value={country}>{COUNTRY_NAMES.of(country) || country}</option>)}
                  </select>
                  {form.country === "NG" && nigerianStates.length > 0 ? (
                    <select name="state" value={form.state} onChange={handleChange} required>
                      <option value="">Select your state</option>
                      {nigerianStates.map((state) => <option key={state} value={state}>{state}</option>)}
                    </select>
                  ) : (
                    <input name="state" placeholder="State / Region" value={form.state} onChange={handleChange} />
                  )}
                  <label className="checkout-address-label">Delivery partner or collection park <span>Your parcel will be sent to the closest available terminal in your state; we will confirm the exact terminal before dispatch.</span><select name="pickupTransportCompany" value={form.pickupTransportCompany} onChange={handleChange} required><option value="">{form.state ? "Select a delivery partner or park" : "Select your state first"}</option>{transportCompanies.map((company) => <option key={company._id} value={company.name}>{company.name}</option>)}<option value="Other / specify a delivery partner or park">Other / specify a delivery partner or park</option></select></label><label className="checkout-address-label">Other delivery partner or park <span>Complete this only when you select “Other / specify” above.</span><input name="pickupOtherLocation" placeholder="Enter the delivery partner or park" value={form.pickupOtherLocation} onChange={handleChange} required={form.pickupTransportCompany === "Other / specify a delivery partner or park"} /></label>
                </>
              ) : (
                <div className="checkout-pickup-note">
                  <strong>RESYIN office pickup selected</strong>
                  <span>Collect from RESYIN Publications in Benin City after confirmation.</span>
                </div>
              )}

              <textarea
                name="notes"
                placeholder="Additional Notes"
                value={form.notes}
                onChange={handleChange}
              />

              <fieldset className="payment-methods">
                <legend>Choose a payment method</legend>
                {!hasPublisherBooks && <label className="payment-method-option">
                  <input type="radio" name="paymentMethod" value="paystack" checked={form.paymentMethod === "paystack"} onChange={handleChange} />
                  <span><strong>Pay online securely</strong><small>Use card, bank transfer, or USSD through Paystack.</small></span>
                </label>}
                {canPayPublisherDirectly && <label className="payment-method-option"><input type="radio" name="paymentMethod" value="publisher_direct_transfer" checked={form.paymentMethod === "publisher_direct_transfer"} onChange={handleChange} /><span><strong>Pay the publisher directly</strong><small>Transfer to the publisher's verified account. The book becomes downloadable after the publisher confirms payment.</small></span></label>}
                {storePaymentSettings?.manualTransferEnabled && <label className="payment-method-option"><input type="radio" name="paymentMethod" value="manual_bank_transfer" checked={form.paymentMethod === "manual_bank_transfer"} onChange={handleChange} /><span><strong>Transfer directly to RESYIN</strong><small>{storePaymentSettings.accountName} · {storePaymentSettings.accountNumber} · {storePaymentSettings.bankName}{storePaymentSettings.transferInstructions ? ` — ${storePaymentSettings.transferInstructions}` : ""}</small></span></label>}
                <label className="payment-method-option"><input type="radio" name="paymentMethod" value="cash_on_delivery" checked={form.paymentMethod === "cash_on_delivery"} onChange={handleChange} /><span><strong>Pay on delivery by transfer</strong><small>When the agent arrives, transfer to the official RESYIN account sent to your WhatsApp or phone. The agent confirms payment before handing over the order; no cash is collected.</small></span></label>
              </fieldset>

              <button
                type="submit"
                className="primary checkout-submit-button"
                disabled={checkoutLoading || Boolean(shippingError)}
              >
                {checkoutLoading
                  ? "Processing…"
                    : form.paymentMethod === "publisher_direct_transfer"
                      ? "Place Direct Publisher Payment Order"
                      : form.paymentMethod === "cash_on_delivery"
                        ? "Place Pay-on-Delivery Order"
                      : form.paymentMethod === "manual_bank_transfer"
                        ? "Place Bank Transfer Order"
                      : "Continue to Secure Online Payment"}
              </button>
              <p style={{ marginTop: 12, fontSize: 14, color: "#666" }}>
                By placing your order, you accept our{" "}
                <a href="/refund-policy" style={{ color: "var(--gold)" }}>
                  Refund & Returns Policy
                </a>{" "}
                and{" "}
                <a href="/terms-conditions" style={{ color: "var(--gold)" }}>
                  Terms & Conditions
                </a>
                .
              </p>
              {shippingError && (
                <div className="error-message" style={{ marginTop: 12 }}>
                  <p>{shippingError}</p>
                  <a
                    href="https://wa.me/2349041441646"
                    target="_blank"
                    rel="noreferrer"
                    className="secondary-button"
                    style={{ marginTop: 12, display: "inline-block" }}
                  >
                    Contact Support on WhatsApp
                  </a>
                </div>
              )}
              {checkoutError && (
                <p className="error-message" style={{ marginTop: 12 }}>
                  {checkoutError}
                </p>
              )}
            </form>

            <div className="cart-summary">
              <h2>Order Summary</h2>

              {cart.map((item) => (
                <div key={item.productId} className="checkout-summary-item">
                  <div>
                    <p>{item.name}</p>
                    <small>
                      {item.quantity} × ₦{Number(item.price).toLocaleString()}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="checkout-remove-item"
                    onClick={() => removeCheckoutItem(item.productId, item.editionKey)}
                    aria-label={`Remove ${item.name} from checkout`}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <hr />

              <p>
                Subtotal:
                <strong>₦{subtotal.toLocaleString()}</strong>
              </p>

              <p>
                Delivery fee:
                <strong>₦{shippingFee.toLocaleString()}</strong>
              </p>

              <h2>Total to pay: ₦{totalAmount.toLocaleString()}</h2>
              <p className="muted" style={{ marginTop: 6 }}>
                {form.deliveryMethod === "pickup" ? "RESYIN office pickup selected — no shipping fee applies." : `Collection from ${form.pickupTransportCompany === "Other / specify a delivery partner or park" ? form.pickupOtherLocation || "your selected delivery partner" : form.pickupTransportCompany || "your selected delivery partner"} — the delivery fee is included above.`}
              </p>
              <p className="muted" style={{ marginTop: 6 }}>
                This amount becomes sales revenue only after payment is
                confirmed.
              </p>
              {shippingInfo?.serviceName && <p><span>Delivery method:</span><strong>{shippingInfo.serviceName}</strong></p>}
              {shippingInfo?.estimatedDays && <p><span>Estimated delivery:</span><strong>{shippingInfo.estimatedDays}</strong></p>}
              {shippingInfo?.dutiesAndTaxes && form.country !== "NG" && (
                <p className="muted">
                  {shippingInfo.dutiesAndTaxes === "included" ? "Duties and taxes are included." : "Import duties and taxes, if applicable, are paid by the customer."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
