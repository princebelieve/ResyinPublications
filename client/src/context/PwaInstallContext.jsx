/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const PwaInstallContext = createContext(null);

function detectIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function detectInstalled() {
  return window.matchMedia?.("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
}

export function PwaInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => detectInstalled());
  const isIOS = detectIOS();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const handleInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const requestInstall = useCallback(async () => {
    if (isIOS) return { outcome: "ios" };
    if (!deferredPrompt) return { outcome: "unavailable" };

    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    // A beforeinstallprompt event is single-use. Never retain a stale event.
    setDeferredPrompt(null);
    return choice || { outcome: "dismissed" };
  }, [deferredPrompt, isIOS]);

  const value = useMemo(() => ({
    isIOS,
    isInstalled,
    canInstall: !isInstalled && (isIOS || Boolean(deferredPrompt)),
    requestInstall,
  }), [deferredPrompt, isIOS, isInstalled, requestInstall]);

  return <PwaInstallContext.Provider value={value}>{children}</PwaInstallContext.Provider>;
}

export function usePwaInstall() {
  const context = useContext(PwaInstallContext);
  if (!context) throw new Error("usePwaInstall must be used within PwaInstallProvider");
  return context;
}
