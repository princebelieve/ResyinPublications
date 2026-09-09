import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const benefits = [
  "Install RESYIN for one-tap access from your home screen.",
  "Get timely order, author, and book updates.",
  "Open RESYIN faster, with an app-like full-screen experience.",
];

function isInstalled() {
  return (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
    || window.navigator.standalone === true;
}

export default function PwaInstallBanner() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [benefitIndex, setBenefitIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.navigator.standalone;
    const canInstall = () => Boolean(window.__deferredPrompt) || isiOS;
    const showWhenAvailable = () => {
      if (!isInstalled() && !localStorage.getItem("pwaInstallDismissed") && canInstall()) setEligible(true);
    };

    if (localStorage.getItem("pwaInstallDismissed")) setDismissed(true);
    const timer = window.setTimeout(showWhenAvailable, 12000);
    window.addEventListener("beforeinstallprompt", showWhenAvailable);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", showWhenAvailable);
    };
  }, []);

  useEffect(() => {
    if (!eligible || dismissed) return undefined;
    let holdTimer; let leaveTimer; let waitTimer;
    const showNext = () => {
      setLeaving(false);
      setVisible(true);
      holdTimer = window.setTimeout(() => {
        setLeaving(true);
        leaveTimer = window.setTimeout(() => {
          setVisible(false);
          setBenefitIndex((current) => (current + 1) % benefits.length);
          waitTimer = window.setTimeout(showNext, 22000);
        }, 350);
      }, 8000);
    };
    showNext();
    return () => { window.clearTimeout(holdTimer); window.clearTimeout(leaveTimer); window.clearTimeout(waitTimer); };
  }, [eligible, dismissed]);

  if (!visible || dismissed || isInstalled()) return null;

  async function handleInstall() {
    const deferredPrompt = window.__deferredPrompt;
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === "accepted") {
        setVisible(false);
        setEligible(false);
        window.__deferredPrompt = null;
      }
      return;
    }
    navigate("/install-instructions");
  }

  function dismiss() {
    setVisible(false);
    setEligible(false);
    setDismissed(true);
    localStorage.setItem("pwaInstallDismissed", "true");
  }

  return (
    <aside className={`pwa-install-pill${leaving ? " leaving" : ""}`} aria-label="Install the RESYIN app">
      <Download size={17} aria-hidden="true" />
      <div className="pwa-install-pill-copy">
        <strong>RESYIN App</strong>
        <span key={benefitIndex}>{benefits[benefitIndex]}</span>
      </div>
      <button type="button" onClick={handleInstall}>Install</button>
      <button type="button" className="pwa-install-pill-dismiss" onClick={dismiss} aria-label="Dismiss install suggestion"><X size={16} /></button>
    </aside>
  );
}
