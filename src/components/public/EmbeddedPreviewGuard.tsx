import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { isPublicPath } from "../../utils/routes";
import { postToParent } from "../../utils/previewBridge";

/**
 * In embedded preview, blocks navigation to Admin and Min side inside the iframe.
 */
export function EmbeddedPreviewGuard() {
  const [searchParams] = useSearchParams();
  const [blockedNotice, setBlockedNotice] = useState(false);
  const embedded = searchParams.get("embedded") === "1" && window.parent !== window;

  useEffect(() => {
    if (!embedded) return;

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }
      const path = href.split("?")[0].split("#")[0];
      if (!path || isPublicPath(path)) return;
      event.preventDefault();
      event.stopPropagation();
      setBlockedNotice(true);
      postToParent({ type: "preview:blocked", reason: "internal-route" }, window.location.origin);
      window.setTimeout(() => setBlockedNotice(false), 4000);
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [embedded]);

  if (!blockedNotice) return null;

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] max-w-md px-4 py-3 rounded-xl bg-stone-900 text-stone-100 text-xs shadow-lg border border-stone-700"
      role="status"
    >
      <p className="font-semibold">Admin og Min side åpnes ikke i forhåndsvisningen.</p>
      <p className="text-stone-400 mt-1">Du redigerer fortsatt i CMS-vinduet ved siden av.</p>
      <Link to="/" className="inline-block mt-2 text-accent-300 hover:text-accent-200 font-semibold">
        Tilbake til nettsiden
      </Link>
    </div>
  );
}
