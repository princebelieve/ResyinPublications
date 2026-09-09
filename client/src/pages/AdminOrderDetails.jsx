//client/src/pages/AdminOrderDetails.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getOrderById, markCashCollectedApi, updateOrderStatusApi, verifyManualTransferApi } from "../services/api";
import { getToken } from "../utils/auth";
import { formatDate } from "../utils/formatDate";

export default function AdminOrderDetails() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    getOrderById(id, getToken()).then(setOrder);
  }, [id]);

  async function updateStatus(orderId, status) {
    try {
      const updated = await updateOrderStatusApi(orderId, status, getToken());

      setOrder(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function markCashCollected() {
    try {
      setOrder(await markCashCollectedApi(order._id, getToken()));
    } catch (err) {
      console.error(err);
    }
  }

  async function verifyManualTransfer() {
    try { setOrder(await verifyManualTransferApi(order._id, getToken())); }
    catch (err) { console.error(err); }
  }

  if (!order) return <p>Loading...</p>;

  return (
    <div className="page order-detail-grid">
      <div className="order-main">
        <h2>Order {order.orderNumber}</h2>

        <div className="order-card">
          <h3>Customer Info</h3>
          <p>{order.customerName}</p>
        </div>

        <div className="order-card">
          <h3>Items</h3>
          {order.items.map((item) => (
            <div key={item.productId} className="order-item">
              {item.quantity} × {item.name}
            </div>
          ))}
        </div>

        <div className="order-card">
          <h3>Status Timeline</h3>
          {order.statusHistory?.map((s, i) => (
            <div key={i}>
              {s.status} — {formatDate(s.date)}
            </div>
          ))}
        </div>
      </div>

      <div className="order-side">
        <div className="order-card">
          <h3>Summary</h3>
          <p>Payment method: {order.paymentMethod === "cash_on_delivery" ? "Pay on delivery" : order.paymentMethod === "manual_bank_transfer" ? "Manual bank transfer" : order.paymentMethod === "distributor_transfer" ? "Distributor transfer" : "Paystack"}</p>
          {order.paymentMethod === "cash_on_delivery" && <p>Payment before handover: {order.cashCollectionStatus}</p>}
          {order.paymentMethod === "manual_bank_transfer" && <p>Transfer verification: {order.manualTransferStatus}</p>}
          {order.paymentInstructions && <p className="muted">{order.paymentInstructions}</p>}
          <p>Total: ₦{order.totalAmount}</p>
          <p>Placed: {formatDate(order.createdAt)}</p>
          {order.paidAt && <p>Paid: {formatDate(order.paidAt)}</p>}
          {order.estimatedDeliveryDate && (
            <p>ETA: {formatDate(order.estimatedDeliveryDate)}</p>
          )}
          {order.deliveredAt && (
            <p>Delivered: {formatDate(order.deliveredAt)}</p>
          )}
          {order.cancelledAt && (
            <p>Cancelled: {formatDate(order.cancelledAt)}</p>
          )}
        </div>

        <div className="order-card">
          <h3>Update Status</h3>

          <select
            value={order.deliveryStatus}
            onChange={(e) => updateStatus(order._id, e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>

        {order.paymentMethod === "cash_on_delivery" && order.paymentStatus !== "paid" && (
          <div className="order-card">
            <h3>Confirm payment before handover</h3>
            <p>Confirm the customer’s bank transfer with the delivery agent before handing over this order. The agent must not collect cash.</p>
            <button type="button" className="primary" onClick={markCashCollected}>Confirm transfer and release order</button>
          </div>
        )}
        {order.paymentMethod === "manual_bank_transfer" && order.paymentStatus !== "paid" && (
          <div className="order-card"><h3>Bank transfer verification</h3><p>Confirm the transfer in your bank account before marking this order paid.</p><button type="button" className="primary" onClick={verifyManualTransfer}>Verify transfer and confirm order</button></div>
        )}
      </div>
    </div>
  );
}
