//client/src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { completePendingPayment, confirmPublisherOrderPayment, getMyOrders, getPendingPublisherOrders, getProfile } from "../services/api";
import { formatDate } from "../utils/formatDate";
import useAuth from "../context/AuthContext";
import UserLayout from "../components/user/UserLayout";

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [publisherOrders, setPublisherOrders] = useState([]);
  const [user, setUser] = useState(null);
  const { token, setUser: setAuthenticatedUser } = useAuth();
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const profile = await getProfile(token);
        setUser(profile.user);
        setAuthenticatedUser(profile.user);

        const ordersData = await getMyOrders(token);
        setOrders(ordersData);
        const publisherOrderData = await getPendingPublisherOrders(token).catch(() => []);
        setPublisherOrders(Array.isArray(publisherOrderData) ? publisherOrderData : []);
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, [token]);

  const activeOrdersCount = orders.filter(
    (o) => o.deliveryStatus !== "delivered" && o.deliveryStatus !== "cancelled",
  ).length;

  const deliveredOrdersCount = orders.filter(
    (o) => o.deliveryStatus === "delivered",
  ).length;

  async function completePayment(orderId) {
    try {
      const response = await completePendingPayment(orderId);
      window.location.assign(response.authorization_url);
    } catch (error) {
      setNotice(error.message || "Unable to restart payment. Please try again.");
    }
  }

  async function confirmPublisherPayment(orderId) {
    try {
      await confirmPublisherOrderPayment(orderId, token);
      setPublisherOrders((current) => current.filter((order) => order._id !== orderId));
    } catch (error) {
      setNotice(error.message || "Unable to confirm this customer payment.");
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
          <button onClick={() => window.location.assign("/collection")}>
            Shop Books
          </button>
          <button onClick={() => window.location.assign("/cart")}>
            View Cart
          </button>
          <button onClick={() => window.location.assign("/checkout")}>
            Continue Checkout
          </button>
          <button onClick={() => window.location.assign("/profile")}>
            Edit Profile
          </button>
          <button onClick={() => window.location.assign("/publish-with-us")}>Publish a book with RESYIN</button>
        </div>
        {notice && <p className="inline-toast success">{notice}</p>}
        {publisherOrders.length > 0 && <section className="content-card publisher-orders"><h2>Publisher payment confirmations</h2><p className="muted">Confirm each direct payment after checking your bank account. Digital downloads and fulfilment remain locked until confirmation.</p>{publisherOrders.map((order) => <article key={order._id}><strong>Order #{order._id.slice(-6).toUpperCase()}</strong><span>{order.items.filter((item) => item.publisherId === String(user?._id)).map((item) => `${item.quantity} × ${item.name}`).join(", ")}</span><span>{order.paymentInstructions}</span><button type="button" className="primary" onClick={() => confirmPublisherPayment(order._id)}>Confirm customer payment</button></article>)}</section>}

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
              onClick={() => window.location.assign("/collection")}
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
