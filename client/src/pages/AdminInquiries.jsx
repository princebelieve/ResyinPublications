//client/src/pages/AdminInquiries.jsx
import { useEffect, useState } from "react";
import { getInquiries } from "../services/api";
import { formatDate } from "../utils/formatDate";
import useAuth from "../context/AuthContext";

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    async function loadInquiries() {
      try {
        const data = await getInquiries(token);
        setInquiries(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadInquiries();
  }, [token]);

  if (loading) {
    return <div className="admin-card">Loading inquiries...</div>;
  }

  return (
    <div>
      <h1 className="title">Book Enquiries</h1>

      {inquiries.length === 0 ? (
        <div className="admin-card">
          <h3>No inquiries yet</h3>

          <p>
            Book enquiries will appear here when visitors submit the
            inquiry form.
          </p>
        </div>
      ) : (
        <div className="admin-grid">
          {inquiries.map((item) => (
            <div key={item._id} className="admin-card">
              <h3>{item.fullName}</h3>
              <p>{item.email}</p>
              <p>{item.phone}</p>{" "}
              <p>
                <strong>Submitted:</strong> {formatDate(item.createdAt)}
              </p>
              <p>
                <strong>Interest:</strong> {item.projectType}
              </p>
              {item.roomType && (
                <p>
                  <strong>Area:</strong> {item.roomType}
                </p>
              )}
              {item.budget && (
                <p>
                  <strong>Budget:</strong> {item.budget}
                </p>
              )}
              {item.timeline && (
                <p>
                  <strong>Timeline:</strong> {item.timeline}
                </p>
              )}
              {item.message && <p>{item.message}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
