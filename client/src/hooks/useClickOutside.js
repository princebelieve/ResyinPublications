//client/src/hooks/useClickOutside.js
import { useEffect, useRef } from "react";

export default function useClickOutside(refs, handler, enabled = true) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    function listener(event) {
      const refArray = Array.isArray(refs) ? refs : [refs];

      const clickedInside = refArray.some((ref) => {
        if (!ref) return false;

        const node = ref.current !== undefined ? ref.current : ref;

        if (!node || typeof node.contains !== "function") return false;

        return node.contains(event.target);
      });

      if (clickedInside) return;

      savedHandler.current(event);
    }

    document.addEventListener("pointerdown", listener, true);

    function handleKeyDown(event) {
      if (event.key === "Escape") savedHandler.current(event);
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", listener, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [refs, enabled]);
}
