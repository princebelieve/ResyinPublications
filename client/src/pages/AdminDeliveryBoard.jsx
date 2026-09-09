//client/src/pages/AdminDeliveryBoard.jsx
import { useEffect, useState } from "react";
import { getAdminOrders } from "../services/api";
import { getToken } from "../utils/auth";
import { formatDate } from "../utils/formatDate";

export default function AdminDeliveryBoard() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    getAdminOrders(getToken()).then(setOrders);
  }, []);

  const stages = ["pending", "confirmed", "processing", "shipped", "delivered"];

  return (
    <>
      <h2>Delivery Pipeline</h2>

      <div className="kanban">
        {stages.map((stage) => (
          <div key={stage} className="kanban-column">
            <h4>{stage.toUpperCase()}</h4>

            {orders
              .filter((o) => o.deliveryStatus === stage)
              .map((o) => (
                <div key={o._id} className="kanban-card">
                  <strong>{o.orderNumber}</strong>

                  <p>{o.customerName}</p>

                  <p>₦{Number(o.totalAmount).toLocaleString()}</p>
                  <p>Placed: {formatDate(o.createdAt)}</p>
                  {o.estimatedDeliveryDate && (
                    <p>ETA: {formatDate(o.estimatedDeliveryDate)}</p>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
