import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function useScrollReveal() {
  const location = useLocation();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("active");
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    const observeReveal = (element) => {
      if (!(element instanceof Element) || !element.matches(".reveal")) return;
      observer.observe(element);
      if (element.getBoundingClientRect().top < window.innerHeight) element.classList.add("active");
    };

    document.querySelectorAll(".reveal").forEach(observeReveal);

    // Home adds featured media after its API request resolves. Without watching
    // for it, that new .reveal section remains opacity: 0 but still reserves
    // space in the page.
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          observeReveal(node);
          node.querySelectorAll(".reveal").forEach(observeReveal);
        });
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [location.pathname]);
}
