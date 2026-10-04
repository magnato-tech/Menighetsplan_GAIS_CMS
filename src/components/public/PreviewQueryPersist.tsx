import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { previewSearchFor, readPreviewModeFlags } from "../../utils/previewBridge";

/**
 * Keeps preview=true (and embedded=1 in iframe) on internal navigation.
 * Flags are read once at mount from the initial URL.
 */
export function PreviewQueryPersist() {
  const location = useLocation();
  const navigate = useNavigate();
  const flagsRef = useRef<ReturnType<typeof readPreviewModeFlags> | null>(null);

  if (flagsRef.current === null && typeof window !== "undefined") {
    const isIframe = window.parent !== window;
    flagsRef.current = readPreviewModeFlags(window.location.search, isIframe);
  }

  const flags = flagsRef.current;

  useEffect(() => {
    if (!flags?.preview) return;
    const params = new URLSearchParams(location.search);
    const hasPreview = params.get("preview") === "true";
    const hasEmbedded = !flags.embedded || params.get("embedded") === "1";
    if (hasPreview && hasEmbedded) return;

    const required = previewSearchFor(flags);
    navigate(`${location.pathname}${location.hash}${required}`, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate, flags]);

  return null;
}
