export default function CollectionDetails({ order }) {
  if (order.deliveryMethod === "digital" || order.shippingService === "Digital download") return <p>Digital download — no collection required.</p>;
  if (order.deliveryMethod === "pickup") return <p>Office pickup: {order.pickupLocation || "RESYIN Publications, Benin City"}</p>;
  if (!order.transportCompanyPickupPoint) return null;
  return <div><p>Requested partner: {order.transportCompanyPickupPoint}</p><p>Destination: {order.collectionState || order.state}</p><p>{order.confirmedCollectionPoint ? `Confirmed terminal: ${order.confirmedCollectionPoint}` : "Exact collection terminal awaiting RESYIN confirmation."}</p></div>;
}
