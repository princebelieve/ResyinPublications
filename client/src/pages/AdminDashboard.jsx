//client/src/pages/AdminDashboard.jsx

import { useEffect, useState } from "react";

import {
  getAdminOrders,
  getProducts,
} from "../services/api";

import { getToken } from "../utils/auth";

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [productsData, ordersData] = await Promise.all([
          getProducts(),
          getAdminOrders(getToken()),
        ]);

        setProducts(productsData);
        setOrders(ordersData);
      } catch (err) {
        console.error(err);
      }
    }

    loadData();
  }, []);

  const paidOrders = orders.filter((order) => order?.paymentStatus === "paid");

  const totalRevenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0,
  );

  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <div className="page">
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Products</h3>
          <div className="kpi-value">{products.length}</div>
        </div>

        <div className="kpi-card">
          <h3>Total Orders</h3>
          <div className="kpi-value">{orders.length}</div>
        </div>

        <div className="kpi-card">
          <h3>Total Revenue</h3>
          <div className="kpi-value">₦{totalRevenue.toLocaleString()}</div>
        </div>

        <div className="kpi-card">
          <h3>Low Stock</h3>
          <div className="kpi-value">{lowStock.length}</div>
        </div>
      </div>

    </div>
  );
}
