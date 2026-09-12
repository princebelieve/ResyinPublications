import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePwaInstall } from "../context/PwaInstallContext";

const benefits = [
  "Install RESYIN for one-tap access from your home screen.",
  "Get timely order, author, and book updates.",
  "Open RESYIN faster, with an app-like full-screen experience.",
];

export default function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [benefitIndex, setBenefitIndex] = useState(0);
  const navigate = useNavigate();
  const { canInstall, isIOS, requestInstall } = usePwaInstall();

  useEffect(() => {
    if (!canInstall || localStorage.getItem("pwaInstallDismissed")) return undefined;
    const timer = window.setTimeout(() => setVisible(true), 12000);
    return () => window.clearTimeout(timer);
  }, [canInstall]);

  useEffect(() => {
    if (!visible || dismissed) return undefined;
    const holdTimer = window.setTimeout(() => {
      setLeaving(true);
      window.setTimeout(() => {
        setVisible(false);
        setLeaving(false);
        setBenefitIndex((current) => (current + 1) % benefits.length);
      }, 350);
    }, 8000);
    return () => window.clearTimeout(holdTimer);
  }, [visible, dismissed]);

  if (!visible || dismissed || !canInstall) return null;

  async function handleInstall() {
    const result = await requestInstall();
    if (result.outcome === "ios" || isIOS) {
      navigate("/install-instructions");
      return;
    }
    setVisible(false);
  }

  function dismiss() {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem("pwaInstallDismissed", "true");
  }

  return (
    <aside className={`resyin-install-card${leaving ? " leaving" : ""}`} aria-label="Install RESYIN Publications">
      <div className="resyin-install-mark"><Download size={18} aria-hidden="true" /></div>
      <div className="resyin-install-copy">
        <strong>Take RESYIN with you</strong>
        <span key={benefitIndex}>{benefits[benefitIndex]}</span>
      </div>
      <button type="button" className="resyin-install-action" onClick={handleInstall}>Install</button>
      <button type="button" className="resyin-install-close" onClick={dismiss} aria-label="Dismiss install suggestion"><X size={16} /></button>
    </aside>
  );
}
