import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls to in-page section anchors after navigation (e.g. /#hva-skjer). */
export function PublicHashScroll() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = decodeURIComponent(hash.replace("#", ""));
    if (!id) return;

    const scrollToTarget = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    const frame = window.requestAnimationFrame(scrollToTarget);
    const timer = window.setTimeout(scrollToTarget, 120);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [hash, pathname]);

  return null;
}
