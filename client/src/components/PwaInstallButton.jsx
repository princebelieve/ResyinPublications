import { Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePwaInstall } from "../context/PwaInstallContext";

export default function PwaInstallButton() {
  const navigate = useNavigate();
  const { canInstall, isIOS, requestInstall } = usePwaInstall();

  if (!canInstall) return null;

  async function handleInstall() {
    const result = await requestInstall();
    if (result.outcome === "ios" || isIOS) navigate("/install-instructions");
  }

  return (
    <button type="button" className="install-btn" onClick={handleInstall} aria-label="Install app" title="Install RESYIN PUBLICATIONS">
      <Download size={20} />
    </button>
  );
}
