import React from "react";
import { CmsPage } from "../../../../data/cmsData";
import { ExternalLink, X } from "lucide-react";

export interface PagePreviewModalProps {
  page?: Partial<CmsPage> | null;
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * PagePreviewModal
 * Gir tilgang til ekte forhåndsvisning i ny fane der redaktøren kan se nettsiden 1:1.
 */
export const PagePreviewModal: React.FC<PagePreviewModalProps> = ({ page, isOpen, onClose }) => {
  if (isOpen === false) return null;
  const slug = page?.slug || "";
  const targetUrl = page?.linkUrl || (slug === "forside" || !slug ? "/" : `/${slug}`);
  const previewUrl = `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}preview=true`;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[var(--studio-bg)] border border-[var(--studio-border)] rounded-2xl max-w-lg w-full p-6 text-[var(--studio-text)] space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">Forhåndsvisning: {page?.title || "Side"}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[var(--studio-surface)] text-[var(--studio-muted)] hover:text-[var(--studio-text)] cursor-pointer"
              aria-label="Lukk"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--studio-muted)]">
          Forhåndsvisning åpnes nå direkte i en egen nettleserfane slik at du ser den ekte layouten side om side med CMS-et.
        </p>
        <div className="flex items-center justify-end gap-2 pt-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-xl bg-[var(--studio-surface)] hover:bg-[var(--studio-hover)] text-[var(--studio-muted)] cursor-pointer"
            >
              Lukk
            </button>
          )}
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Åpne i ny fane</span>
          </a>
        </div>
      </div>
    </div>
  );
};
