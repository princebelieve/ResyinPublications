//client/src/pages/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSending(true);
      const res = await forgotPassword(email);

      if (res.message) {
        setSent(true);
      } else {
        alert("Something went wrong");
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Unable to send reset link.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="form" style={{ marginTop: 50 }}>
        <h1>Forgot Password</h1>

        <p>Enter your email and we’ll send you a reset link.</p>

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button type="submit" className="btn-primary" disabled={sending}>
                {sending ? "Sending..." : "Send Reset Link"}
              </button>
            </div>
          </form>
        ) : (
          <p style={{ marginTop: 10, color: "#2e7d32" }}>
            If that email exists, a password reset link has been sent.
          </p>
        )}

        <div style={{ marginTop: 18 }}>
          <Link to="/login" style={{ color: "var(--gold)" }}>
            Back to Login
          </Link>
        </div>
      </div>
    </>
  );
}
