//client/src/pages/Register.jsx
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { registerUser, resendVerificationEmail, signInWithGoogle } from "../services/api";
import useAuth from "../context/AuthContext";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const { login } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      setRegisteredEmail(form.email.trim());
      setRegistrationMessage(
        result.verificationEmailSent === false
          ? "Your account was created, but the verification email could not be sent. Use Resend verification email below."
          : "Account created. Check your email, including spam, to verify your address.",
      );
    } catch (err) {
      console.error(err);
      alert(err.message || "Unable to connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setSubmitting(true);
      await resendVerificationEmail(registeredEmail);
      setRegistrationMessage("A new verification email has been requested. Check your inbox and spam folder.");
    } catch (err) {
      setRegistrationMessage(err?.message || "Unable to resend the verification email.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (idToken) => {
    try {
      setSubmitting(true);
      const res = await signInWithGoogle(idToken);

      if (!res.accessToken || !res.refreshToken) {
        alert(res.message || "Google sign-in failed.");
        return;
      }

      await login(res.accessToken, res.refreshToken);
      const payload = JSON.parse(atob(res.accessToken.split(".")[1]));

      if (payload.role === "admin") {
        navigate("/admin/products");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      alert(
        err?.message ||
          "Unable to create account with Google. Please try again.",
      );
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
      <Navbar /> {/* ✅ THIS WAS WHAT YOU WERE MISSING */}
      <div className="form auth-form register-auth-form" style={{ marginTop: 50 }}>
        <h1>Create Account</h1>
        <p className="muted" style={{ marginBottom: 20 }}>
          Join a community built around health, opportunity, and freedom.
        </p>

        {registrationMessage && (
          <div className="auth-message" role="status">
            <p>{registrationMessage}</p>
            {registeredEmail && (
              <button type="button" onClick={handleResendVerification} disabled={submitting}>
                Resend verification email
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              type="text"
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />

            <div className="password-wrap">
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

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              required
            />

            {/* Policy Checkboxes */}
            <div className="consent-options">
              <label className="consent-option">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                />
                I agree to the{" "}
                <Link
                  to="/privacy-policy"
                  target="_blank"
                  style={{ color: "var(--gold)", textDecoration: "underline" }}
                >
                  Privacy Policy
                </Link>
              </label>

              <label className="consent-option">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                I agree to the{" "}
                <Link
                  to="/terms-conditions"
                  target="_blank"
                  style={{ color: "var(--gold)", textDecoration: "underline" }}
                >
                  Terms & Conditions
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={submitting || !acceptedPrivacy || !acceptedTerms}
              style={{
                marginTop: 16,
                opacity:
                  submitting || !acceptedPrivacy || !acceptedTerms ? 0.5 : 1,
                cursor:
                  submitting || !acceptedPrivacy || !acceptedTerms
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              {submitting ? "Creating account..." : "Create Account"}
            </button>

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

            <p style={{ marginTop: 12, fontSize: 14, color: "#666" }}>
              By creating an account, you agree to our{" "}
              <Link to="/privacy-policy" style={{ color: "var(--gold)" }}>
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/terms-conditions" style={{ color: "var(--gold)" }}>
                Terms & Conditions
              </Link>
              .
            </p>
          </div>
        </form>

        <p style={{ marginTop: 16, fontSize: 14 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--gold)" }}>
            Login here
          </Link>
        </p>
      </div>
    </>
  );
}
