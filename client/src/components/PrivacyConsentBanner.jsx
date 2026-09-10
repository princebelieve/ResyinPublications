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
    <aside className="resyin-privacy-note" role="dialog" aria-label="Privacy notice">
      <div className="resyin-privacy-copy">
        <strong>A note about privacy</strong>
        <p>
          We use essential account and order data to run the bookstore. <Link to="/privacy-policy">Read the policy</Link>.
        </p>
      </div>
      <div className="resyin-privacy-actions">
        <button type="button" className="resyin-privacy-accept" onClick={acceptPrivacy}>
          Got it
        </button>
      </div>
    </aside>
  );
}
