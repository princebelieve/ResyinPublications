//client/src/pages/Profile.jsx
import { useEffect, useState } from "react";

import useAuth from "../context/AuthContext";

import { getProfile } from "../services/api";
import { formatDate } from "../utils/formatDate";

import UserLayout from "../components/user/UserLayout";

import { Link } from "react-router-dom";

export default function Profile() {
  const { token, user: authUser } = useAuth();

  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const data = await getProfile(token);

        setUser(data.user);
      } catch (err) {
        console.error(err);
      }
    }

    load();
  }, [token]);

  return (
    <UserLayout>
      <div className="profile-page">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase()
              )}
            </div>

            <div>
              <h1>{user?.name}</h1>

              <p className="profile-email" style={{ margin: "4px 0", color: "var(--text)" }}>
                {user?.email}
              </p>

              <p className="profile-role" style={{ marginTop: "8px" }}>
                {authUser?.role === "admin" ? "Administrator" : "Customer"}
              </p>
              {user?.createdAt && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "12px",
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Member since {formatDate(user.createdAt)}
                </p>
              )}
            </div>
          </div>

          <h3
            style={{
              color: "var(--brown)",
              marginTop: "28px",
              marginBottom: "16px",
            }}
          >
            Contact Information
          </h3>
          <div className="profile-info-grid">
            <div className="profile-info-card">
              <span>Phone</span>
              <strong>{user?.phone || "Not set"}</strong>
            </div>

            <div className="profile-info-card">
              <span>Address</span>
              <strong>{user?.address || "Not set"}</strong>
            </div>

            <div className="profile-info-card">
              <span>City</span>
              <strong>{user?.city || "Not set"}</strong>
            </div>

            <div className="profile-info-card">
              <span>State</span>
              <strong>{user?.state || "Not set"}</strong>
            </div>
          </div>

          <Link to="/profile/edit">
            <button className="profile-edit-btn">Edit Profile</button>
          </Link>
        </div>
      </div>
    </UserLayout>
  );
}
