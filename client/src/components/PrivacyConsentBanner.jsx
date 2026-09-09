import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "resyinPrivacyConsent";

export default function PrivacyConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  function acceptPrivacy() {
    window.localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside className="privacy-consent-banner" role="dialog" aria-label="Privacy notice">
      <div className="privacy-consent-content">
        <strong>RESYIN Publications: books, ideas, and discovery.</strong>
        <p>
          Browse books, discover authors, manage your orders,
          request support, and manage orders. RESYIN uses Google Sign-In to
          create and manage your account, and Gmail API only to send
          account-verification, password-reset, and important service emails from
          our official support account. We do not read, store, or modify the
          contents of your Gmail inbox. Read our <Link to="/privacy-policy">Privacy Policy</Link>.
        </p>
      </div>
      <div className="privacy-consent-actions">
        <Link className="privacy-consent-policy" to="/privacy-policy">
          Read Privacy Policy
        </Link>
        <button type="button" className="privacy-consent-accept" onClick={acceptPrivacy}>
          Accept and continue
        </button>
      </div>
    </aside>
  );
}
