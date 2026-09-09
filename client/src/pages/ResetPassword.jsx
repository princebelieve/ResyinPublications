//client/src/pages/ResetPassword.jsx
import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../services/api";
import Navbar from "../components/Navbar";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [params] = useSearchParams();
  const nav = useNavigate();

  const token = params.get("token");

  async function handleSubmit(e) {
    e.preventDefault();

    if (!token) {
      alert("Invalid reset link. Please request a new password reset email.");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await resetPassword(token, password);

      alert(res.message || "Password reset successful");
      nav("/login");
    } catch (err) {
      console.error(err);
      alert(err?.message || "Unable to reset password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="form" style={{ marginTop: 50 }}>
        <h2>Reset Password</h2>

        <p className="muted" style={{ marginBottom: 20 }}>
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: 14 }}
            disabled={!token || submitting}
          >
            {submitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </>
  );
}
