//client/src/pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { getProfile, loginUser, resendVerificationEmail, signInWithGoogle } from "../services/api";
import useAuth from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setSubmitting(true);
      const res = await loginUser(form);

      if (!res.accessToken || !res.refreshToken) {
        alert(res.message || "Login failed");
        return;
      }

      await login(res.accessToken, res.refreshToken);

      const pendingAnnouncementUrl = sessionStorage.getItem("pendingAnnouncementUrl");
      if (pendingAnnouncementUrl) {
        sessionStorage.removeItem("pendingAnnouncementUrl");
        window.location.href = pendingAnnouncementUrl;
        return;
      }

      let payload;

      try {
        payload = JSON.parse(atob(res.accessToken.split(".")[1]));
      } catch {
        alert("Invalid authentication token");
        return;
      }

      const pendingCheckout = localStorage.getItem("pendingCheckout");
      const profile = await getProfile(res.accessToken);
      const isPublisherApproved = profile?.user?.publisherStatus === "approved";

      if (payload.role === "admin") {
        navigate("/admin/products");
      } else if (isPublisherApproved) {
        navigate("/publish-with-us");
      } else if (pendingCheckout === "true") {
        localStorage.removeItem("pendingCheckout");

        navigate("/checkout");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);

      if (error?.message?.toLowerCase().includes("verify your email")) {
        setResendMessage("Your account needs email verification. Request a fresh verification email below.");
      } else {
        alert(error?.message || "Unable to login. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (!form.email.trim()) {
      setResendMessage("Enter your email address first.");
      return;
    }

    try {
      setSubmitting(true);
      await resendVerificationEmail(form.email.trim());
      setResendMessage("A fresh verification email has been requested. Check your inbox and spam folder.");
    } catch (error) {
      setResendMessage(error?.message || "Unable to resend the verification email.");
    } finally {
      setSubmitting(false);
    }
  }

  const handleGoogleSuccess = async (idToken) => {
    try {
      setSubmitting(true);
      const res = await signInWithGoogle(idToken);

      if (!res.accessToken || !res.refreshToken) {
        alert(res.message || "Google sign-in failed.");
        return;
      }

      await login(res.accessToken, res.refreshToken);
      const pendingAnnouncementUrl = sessionStorage.getItem("pendingAnnouncementUrl");
      if (pendingAnnouncementUrl) {
        sessionStorage.removeItem("pendingAnnouncementUrl");
        window.location.href = pendingAnnouncementUrl;
        return;
      }
      const payload = JSON.parse(atob(res.accessToken.split(".")[1]));
      const profile = await getProfile(res.accessToken);
      const isPublisherApproved = profile?.user?.publisherStatus === "approved";

      if (payload.role === "admin") {
        navigate("/admin/products");
      } else if (isPublisherApproved) {
        navigate("/publish-with-us");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      alert(error?.message || "Unable to login with Google. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleError = (message) => {
    console.error(message);
    alert(message || "Google sign-in is unavailable.");
  };

  return (
    <>
      <Navbar />

      <div className="form auth-form login-auth-form" style={{ marginTop: 50 }}>
        <h1>Login</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Welcome back. Continue your RESYIN reading journey.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>

            {resendMessage && (
              <div className="auth-message" role="status">
                <p>{resendMessage}</p>
                {resendMessage.toLowerCase().includes("request a fresh") && (
                  <button type="button" onClick={handleResendVerification} disabled={submitting}>
                    Resend verification email
                  </button>
                )}
              </div>
            )}

            <div
              style={{
                width: "100%",
                marginTop: 8,
                textAlign: "center",
                color: "#555",
              }}
            >
              or
            </div>

            <GoogleSignInButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
            />
          </div>
        </form>

        <p style={{ marginTop: 16, fontSize: 14 }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--gold)" }}>
            Register here
          </Link>
        </p>

        <p style={{ marginTop: 12, fontSize: 14 }}>
          <Link to="/forgot-password" style={{ color: "var(--gold)" }}>
            Forgot password?
          </Link>
        </p>
      </div>
    </>
  );
}
