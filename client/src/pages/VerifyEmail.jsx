import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { verifyEmail } from "../services/api";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState({ loading: true, message: "" });
  const token = params.get("token");

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus({ loading: false, message: "Verification token missing." });
        return;
      }

      try {
        const res = await verifyEmail(token);
        setStatus({
          loading: false,
          message: res.message || "Email verified successfully.",
        });
      } catch (err) {
        console.error(err);
        setStatus({
          loading: false,
          message: err?.message || "Verification failed.",
        });
      }
    }

    verify();
  }, [token]);

  return (
    <>
      <Navbar />

      <div className="form" style={{ marginTop: 50 }}>
        <h1>Email Verification</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          {status.loading
            ? "Checking your verification link..."
            : status.message}
        </p>

        {!status.loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Link to="/login" className="btn-primary">
              Go to Login
            </Link>
            <Link to="/" style={{ color: "var(--gold)", fontWeight: 600 }}>
              Back to Home
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
