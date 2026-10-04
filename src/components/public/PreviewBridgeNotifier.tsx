import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { postToParent, readPreviewModeFlags } from "../../utils/previewBridge";

/** Sends preview:ready and preview:location to the CMS parent when embedded. */
export function PreviewBridgeNotifier() {
  const location = useLocation();

  useEffect(() => {
    const isIframe = window.parent !== window;
    const flags = readPreviewModeFlags(window.location.search, isIframe);
    if (!flags.embedded) return;

    postToParent(
      {
        type: "preview:ready",
        path: location.pathname,
        hash: location.hash,
        revision: 0,
      },
      window.location.origin
    );
  }, []);

  useEffect(() => {
    const isIframe = window.parent !== window;
    const flags = readPreviewModeFlags(window.location.search, isIframe);
    if (!flags.preview) return;

    postToParent(
      {
        type: "preview:location",
        path: location.pathname,
        hash: location.hash,
      },
      window.location.origin
    );
  }, [location.pathname, location.hash]);

  return null;
}
