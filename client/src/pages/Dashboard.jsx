//client/src/pages/Dashboard.jsx
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { applyForDistributor, completePendingPayment, getMyOrders, getProfile, getNigerianBanks, resolveNigerianAccount } from "../services/api";
import { formatDate } from "../utils/formatDate";
import useAuth from "../context/AuthContext";
import UserLayout from "../components/user/UserLayout";
import BankSelect from "../components/BankSelect";

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [user, setUser] = useState(null);
  const { token, setUser: setAuthenticatedUser } = useAuth();
  const [distributorMessage, setDistributorMessage] = useState("");
  const [banks, setBanks] = useState([]);
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [showDistributorForm, setShowDistributorForm] = useState(() => searchParams.get("distributor") === "apply");
  const distributorFormRef = useRef(null);
  const [distributorApplication, setDistributorApplication] = useState({
    businessName: "",
    phone: "",
    pickupAddress: "",
    deliveryCoverage: "",
    bankName: "",
    bankCode: "",
    accountName: "",
    accountNumber: "",
    note: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const profile = await getProfile(token);
        setUser(profile.user);
        setAuthenticatedUser(profile.user);
        setDistributorApplication({
          businessName: profile.user.distributorBusinessName || profile.user.name || "",
          phone: profile.user.phone || "",
          pickupAddress: profile.user.distributorPickupAddress || profile.user.address || "",
          deliveryCoverage: profile.user.distributorDeliveryCoverage || "",
          bankName: profile.user.distributorBankName || "",
          bankCode: profile.user.distributorBankCode || "",
          accountName: profile.user.distributorAccountName || "",
          accountNumber: profile.user.distributorAccountNumber || "",
          note: profile.user.distributorApplicationNote || "",
        });

        const ordersData = await getMyOrders(token);
        setOrders(ordersData);

        const bankData = await getNigerianBanks();
        setBanks(Array.isArray(bankData) ? bankData : bankData.banks || []);
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, [token]);

  useEffect(() => {
    if (searchParams.get("distributor") === "apply") setShowDistributorForm(true);
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("distributor") !== "apply" || !showDistributorForm) return;
    window.requestAnimationFrame(() => {
      distributorFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [searchParams, showDistributorForm]);

  const activeOrdersCount = orders.filter(
    (o) => o.deliveryStatus !== "delivered" && o.deliveryStatus !== "cancelled",
  ).length;

  const deliveredOrdersCount = orders.filter(
    (o) => o.deliveryStatus === "delivered",
  ).length;

  function updateDistributorApplication(event) {
    const { name, value } = event.target;
    setDistributorApplication((current) => {
      if (name === "bankCode") {
        const bank = banks.find((item) => String(item.code) === value);
        return { ...current, bankCode: value, bankName: bank?.name || "", accountName: "" };
      }
      if (name === "accountNumber") return { ...current, accountNumber: value.replace(/\D/g, "").slice(0, 10), accountName: "" };
      return { ...current, [name]: value };
    });
  }

  function chooseDistributorBank(bankCode) {
    const bank = banks.find((item) => String(item.code) === bankCode);
    setDistributorApplication((current) => ({ ...current, bankCode, bankName: bank?.name || "", accountName: "" }));
  }

  async function verifyDistributorAccount() {
    if (!distributorApplication.bankCode || distributorApplication.accountNumber.length !== 10) {
      setDistributorMessage("Select your bank and enter the 10-digit account number first.");
      return;
    }
    setResolvingAccount(true);
    setDistributorMessage("");
    try {
      const result = await resolveNigerianAccount(distributorApplication.bankCode, distributorApplication.accountNumber);
      setDistributorApplication((current) => ({ ...current, accountName: result.accountName || "" }));
    } catch (error) {
      setDistributorMessage(error.message || "We could not verify that account. Check the bank and account number.");
    } finally {
      setResolvingAccount(false);
    }
  }

  async function applyForDistributorAccount(event) {
    event.preventDefault();
    try {
      const response = await applyForDistributor(distributorApplication);
      const updatedUser = {
        ...user,
        distributorStatus: "pending",
        distributorBusinessName: distributorApplication.businessName,
        phone: distributorApplication.phone,
        distributorPickupAddress: distributorApplication.pickupAddress,
        distributorDeliveryCoverage: distributorApplication.deliveryCoverage,
        distributorBankName: distributorApplication.bankName,
        distributorAccountName: distributorApplication.accountName,
        distributorAccountNumber: distributorApplication.accountNumber,
        distributorApplicationNote: distributorApplication.note,
      };
      setUser(updatedUser);
      setAuthenticatedUser(updatedUser);
      setDistributorMessage(response.message || "Your distributor application is pending admin approval.");
      setShowDistributorForm(false);
    } catch (error) {
      console.error(error);
      setDistributorMessage(error.message || "Unable to submit your distributor application.");
    }
  }

  async function completePayment(orderId) {
    try {
      const response = await completePendingPayment(orderId);
      window.location.href = response.authorization_url;
    } catch (error) {
      setDistributorMessage(error.message || "Unable to restart payment. Please try again.");
    }
  }

  return (
    <UserLayout>
      <div className="page">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <div>
            <h1>Welcome back, {user?.name?.split(" ")[0]}!</h1>
            <p className="muted">
              Manage your orders, profile, and account activity
            </p>
          </div>
          <div className="dashboard-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase()
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="dashboard-stats">
          <div className="cart-summary">
            <h3>{orders.length}</h3>
            <p>Total Orders</p>
          </div>

          <div className="cart-summary">
            <h3>{activeOrdersCount}</h3>
            <p>Active Orders</p>
          </div>

          <div className="cart-summary">
            <h3>{deliveredOrdersCount}</h3>
            <p>Delivered</p>
          </div>

          <div className="cart-summary">
            <h3>{user?.state || "N/A"}</h3>
            <p>Location</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-actions">
          <button onClick={() => (window.location.href = "/collection")}>
            Shop Books
          </button>
          <button onClick={() => (window.location.href = "/cart")}>
            View Cart
          </button>
          <button onClick={() => (window.location.href = "/checkout")}>
            Continue Checkout
          </button>
          <button onClick={() => (window.location.href = "/profile")}>
            Edit Profile
          </button>
          {user?.distributorStatus === "approved" ? <button onClick={() => (window.location.href = "/distributor")}>Open Distributor Dashboard</button> : user?.distributorStatus === "pending" ? <button disabled>Distributor application pending</button> : <button onClick={() => showDistributorForm ? setShowDistributorForm(false) : setShowDistributorForm(true)}>{showDistributorForm ? "Close distributor application" : "Apply to become a distributor"}</button>}
        </div>
        {distributorMessage && <p className="inline-toast success">{distributorMessage}</p>}
        {user?.distributorStatus === "pending" && <p className="muted">Your application has been submitted. An RESYIN administrator must approve it before you can access the Distributor Dashboard.</p>}
        {showDistributorForm && user?.distributorStatus !== "pending" && (
          <section ref={distributorFormRef} className="content-card distributor-application">
            <div>
              <p className="eyebrow">Distributor application</p>
              <h2>Tell us how you will serve customers</h2>
              <p className="muted">Buy at distributor prices, sell through your own RESYIN link, and manage your available stock after approval.</p>
            </div>
            <form onSubmit={applyForDistributorAccount} className="form distributor-application-form">
              <div className="form-grid">
                <label>Business or shop name<input name="businessName" value={distributorApplication.businessName} onChange={updateDistributorApplication} required /></label>
                <label>Phone number<input name="phone" type="tel" value={distributorApplication.phone} onChange={updateDistributorApplication} required /></label>
                <label className="form-grid-full">Pickup address<input name="pickupAddress" value={distributorApplication.pickupAddress} onChange={updateDistributorApplication} required /></label>
                <label className="form-grid-full">Delivery areas <span className="muted">(optional)</span><input name="deliveryCoverage" value={distributorApplication.deliveryCoverage} onChange={updateDistributorApplication} placeholder="For example: Ibadan and nearby areas" /></label>
                <label>Bank name<BankSelect id="distributor-application-bank" banks={banks} value={distributorApplication.bankCode} onChange={chooseDistributorBank} required /></label>
                <label>Account number<input name="accountNumber" inputMode="numeric" value={distributorApplication.accountNumber} onChange={updateDistributorApplication} maxLength="10" required /></label>
                <label>Verified account name<input value={distributorApplication.accountName} readOnly placeholder="Verify account to see the name" required /></label>
                <div className="form-grid-full"><button type="button" onClick={verifyDistributorAccount} disabled={resolvingAccount || !distributorApplication.bankCode || distributorApplication.accountNumber.length !== 10}>{resolvingAccount ? "Verifying account…" : "Verify account name"}</button></div>
                <label className="form-grid-full">Anything else we should know? <span className="muted">(optional)</span><textarea name="note" value={distributorApplication.note} onChange={updateDistributorApplication} rows="3" placeholder="Describe your customer base or fulfilment plan" /></label>
              </div>
              <div className="form-actions">
                <button className="primary" type="submit" disabled={!distributorApplication.accountName}>Submit application for review</button>
                <button type="button" onClick={() => setShowDistributorForm(false)}>Cancel</button>
              </div>
            </form>
          </section>
        )}

        {/* Account Information */}
        <div className="profile-info-grid">
          <div className="profile-info-card">
            <span>Email</span>
            <strong>{user?.email}</strong>
          </div>
          <div className="profile-info-card">
            <span>Phone</span>
            <strong>{user?.phone || "Not set"}</strong>
          </div>
          <div className="profile-info-card">
            <span>Address</span>
            <strong>{user?.address || "Not set"}</strong>
          </div>
          <div className="profile-info-card">
            <span>Member Since</span>
            <strong>{formatDate(user?.createdAt)}</strong>
          </div>
        </div>

        {/* Recent Orders Section */}
        <h2 style={{ marginTop: 40, color: "var(--brown)" }}>Recent Orders</h2>

        {orders.length === 0 ? (
          <div
            className="cart-summary"
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "var(--bg)",
            }}
          >
            <p style={{ color: "#999", marginTop: 0 }}>
              No orders yet. Start shopping!
            </p>
            <button
              onClick={() => (window.location.href = "/collection")}
              style={{
                marginTop: 15,
                padding: "12px 24px",
                background: "var(--brown)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Browse Books
            </button>
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {orders.map((order) => (
              <div
                key={order._id}
                className="cart-summary"
                style={{
                  borderLeft: `4px solid var(--gold)`,
                  paddingLeft: "20px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "20px",
                    alignItems: "start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 8px 0", color: "var(--brown)" }}>
                      ₦{Number(order.totalAmount || 0).toLocaleString()}
                    </h3>
                    <p style={{ margin: "4px 0", fontSize: "13px" }}>
                      <strong>Placed:</strong> {formatDate(order.createdAt)}
                    </p>
                    {order.paidAt && (
                      <p style={{ margin: "4px 0", fontSize: "13px" }}>
                        <strong>Paid:</strong> {formatDate(order.paidAt)}
                      </p>
                    )}
                    {order.estimatedDeliveryDate && (
                      <p style={{ margin: "4px 0", fontSize: "13px" }}>
                        <strong>ETA:</strong>{" "}
                        {formatDate(order.estimatedDeliveryDate)}
                      </p>
                    )}
                    {order.deliveryEstimate && (
                      <p style={{ margin: "4px 0", fontSize: "13px" }}>
                        <strong>Delivery estimate:</strong> {order.deliveryEstimate}
                      </p>
                    )}
                    {order.shippingService && (
                      <p style={{ margin: "4px 0", fontSize: "13px" }}>
                        <strong>Delivery method:</strong> {order.shippingService}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        background:
                          order.paymentStatus === "paid"
                            ? "rgba(124, 74, 32, 0.1)"
                            : "rgba(255, 193, 7, 0.1)",
                        color:
                          order.paymentStatus === "paid"
                            ? "var(--brown)"
                            : "#f39c12",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {order.paymentStatus}
                    </span>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        marginTop: "6px",
                        background:
                          order.deliveryStatus === "delivered"
                            ? "rgba(76, 175, 80, 0.1)"
                            : "rgba(201, 162, 74, 0.1)",
                        color:
                          order.deliveryStatus === "delivered"
                            ? "#4caf50"
                            : "var(--gold)",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {order.deliveryStatus}
                    </span>
                  </div>
                </div>

                {order.items && order.items.length > 0 && (
                  <div
                    style={{
                      paddingTop: "12px",
                      borderTop: "1px solid #eee",
                      fontSize: "13px",
                      color: "#666",
                    }}
                  >
                    <strong>Items:</strong>
                    {order.items.map((item, idx) => (
                      <div key={idx} style={{ marginTop: "4px" }}>
                        {item.quantity} × {item.name}
                      </div>
                    ))}
                  </div>
                )}
                {order.paymentMethod === "paystack" && order.paymentStatus === "pending" && (
                  <div className="pending-payment-action">
                    <strong>Payment incomplete</strong>
                    <span>Complete payment before RESYIN can prepare or dispatch this order.</span>
                    <button type="button" className="primary" onClick={() => completePayment(order._id)}>Complete payment</button>
                  </div>
                )}
                {order.paymentMethod === "manual_bank_transfer" && order.paymentStatus !== "paid" && (
                  <div className="pending-payment-action"><strong>Bank transfer awaiting verification</strong><span>{order.paymentInstructions || "Transfer to the account shown on your order confirmation, then send your receipt to RESYIN."}</span></div>
                )}
                {order.paymentMethod === "cash_on_delivery" && order.paymentStatus !== "paid" && (
                  <div className="pending-payment-action"><strong>Pay on delivery by transfer</strong><span>{order.paymentInstructions || "When the agent arrives, transfer to the official RESYIN account sent to your WhatsApp or phone. The agent confirms payment before handing over the order."}</span></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
