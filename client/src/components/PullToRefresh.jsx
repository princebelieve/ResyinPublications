import { useEffect, useRef, useState } from "react";

const PULL_THRESHOLD = 76;
const MAX_PULL_DISTANCE = 112;

function isInteractiveTarget(target) {
  return target instanceof Element && Boolean(target.closest("input, textarea, select, button, [contenteditable=\"true\"]"));
}

export default function PullToRefresh() {
  const startY = useRef(null);
  const pulling = useRef(false);
  const distanceRef = useRef(0);
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    function handleTouchStart(event) {
      if (window.scrollY > 0 || isInteractiveTarget(event.target)) return;
      startY.current = event.touches[0]?.clientY ?? null;
      pulling.current = false;
    }

    function handleTouchMove(event) {
      if (startY.current === null) return;
      const currentY = event.touches[0]?.clientY ?? startY.current;
      const delta = currentY - startY.current;
      if (delta <= 0) return;

      pulling.current = true;
      event.preventDefault();
      const nextDistance = Math.min(delta * 0.55, MAX_PULL_DISTANCE);
      distanceRef.current = nextDistance;
      setDistance(nextDistance);
    }

    function handleTouchEnd() {
      if (pulling.current && distanceRef.current >= PULL_THRESHOLD) {
        window.location.reload();
        return;
      }
      startY.current = null;
      pulling.current = false;
      distanceRef.current = 0;
      setDistance(0);
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    document.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  if (!distance) return null;

  const ready = distance >= PULL_THRESHOLD;
  return (
    <div className={`pull-to-refresh-indicator${ready ? " is-ready" : ""}`} aria-live="polite">
      <span aria-hidden="true">{ready ? "↻" : "↓"}</span>
      <strong>{ready ? "Release to refresh" : "Pull to refresh"}</strong>
    </div>
  );
}
