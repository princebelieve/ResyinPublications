//client/src/pages/AdminOrders.jsx
import { useEffect, useState } from "react";

import { getAdminOrders, updateOrderStatusApi } from "../services/api";
import { formatDate } from "../utils/formatDate";

import { getToken } from "../utils/auth";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      const data = await getAdminOrders(getToken());

      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  async function updateStatus(orderId, status) {
    try {
      await updateOrderStatusApi(orderId, status, getToken());

      loadOrders();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <div className="page">
        <h1>Admin Orders</h1>

        {loading ? (
          <p>Loading orders...</p>
        ) : (
          orders.map((order) => (
            <div
              key={order._id}
              className="order-card"
              style={{ marginBottom: 24 }}
            >
              <div className="order-detail-grid">
                {/* LEFT */}
                <div className="order-main">
                  <div className="order-card">
                    <h2 style={{ marginTop: 0 }}>{order.orderNumber}</h2>

                    <p>
                      Customer: <strong>{order.customerName}</strong>
                    </p>

                    <p>Total: ₦{Number(order.totalAmount).toLocaleString()}</p>
                    <p>Placed: {formatDate(order.createdAt)}</p>
                    {order.paidAt && <p>Paid: {formatDate(order.paidAt)}</p>}
                  </div>

                  <div className="order-card">
                    <h3>Items</h3>

                    {order.items.map((item) => (
                      <div key={item.productId} className="order-item">
                        <span>
                          {item.quantity} × {item.name}
                        </span>

                        <strong>
                          ₦{Number(item.price * item.quantity).toLocaleString()}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT */}
                <div className="order-side">
                  <div className="order-card">
                    <h3>Status</h3>

                    <p>
                      Payment:
                      <strong> {order.paymentStatus}</strong>
                    </p>

                    <p>
                      Delivery:
                      <strong> {order.deliveryStatus}</strong>
                    </p>

                    <select
                      value={order.deliveryStatus}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      style={{
                        width: "100%",
                        marginTop: 12,
                        height: 48,
                        borderRadius: 12,
                        padding: "0 12px",
                      }}
                    >
                      <option value="pending">Pending</option>

                      <option value="confirmed">Confirmed</option>

                      <option value="processing">Processing</option>

                      <option value="shipped">Shipped</option>

                      <option value="delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
