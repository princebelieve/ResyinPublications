//client/src/pages/AdminStockAlerts.jsx
import { useEffect, useState } from "react";
import { getProducts } from "../services/api";

export default function AdminStockAlerts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  const lowStock = products.filter((p) => p.stock <= 5);

  return (
    <>

      <div className="page">
        <h2>Low Stock Alerts</h2>

        {lowStock.map((p) => (
          <div key={p._id} className="alert-low-stock">
            <strong>{p.name}</strong> — Stock: {p.stock}
          </div>
        ))}
      </div>
    </>
  );
}
