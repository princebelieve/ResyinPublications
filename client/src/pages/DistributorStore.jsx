import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProductGrid from "../components/ProductGrid";
import { getDistributorStore } from "../services/api";

export default function DistributorStore() {
  const { code } = useParams();
  const [store, setStore] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    sessionStorage.setItem("activeDistributorCode", code.toUpperCase());
    getDistributorStore(code).then(setStore).catch((err) => setError(err.message || "This distributor shop is unavailable."));
  }, [code]);
  return <><Navbar /><main className="distributor-store"><section className="distributor-store-hero"><div className="container"><span className="eyebrow">OFFICIAL RESYIN DISTRIBUTOR</span><h1>{store ? `${store.distributor.name}'s bookstore` : "Distributor bookstore"}</h1>{store && <p>Shop available RESYIN products from this approved distributor in {store.distributor.city || store.distributor.state || "your area"}.</p>}</div></section><section className="section"><div className="container">{error ? <div className="product-load-error"><p>{error}</p><Link to="/collection">Visit RESYIN Publications</Link></div> : !store ? <p>Loading distributor shop...</p> : <>{store.products.length ? <ProductGrid products={store.products} /> : <p>This distributor has no products available right now.</p>}<p className="muted distributor-store-note">You are shopping through distributor {store.distributor.distributorCode}. Availability is controlled by this distributor.</p></>}</div></section></main></>;
}
