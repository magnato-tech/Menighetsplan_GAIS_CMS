import { useMemo } from "react";
import { useCms } from "../context/CmsContext";
import {
  buildLinkContext,
  resolveCmsLink,
  validateCmsLink,
  type CmsLinkContext,
  type CmsLinkValidation,
} from "../utils/cmsLinks";

export function useCmsLinkResolver() {
  const { pages } = useCms();
  const context = useMemo(() => buildLinkContext(pages), [pages]);

  const resolve = (raw?: string | null, fallback?: string): string | null => {
    const value = raw?.trim() || fallback?.trim() || "";
    if (!value) return null;
    if (validateCmsLink(value, context).status !== "ok") return null;
    return resolveCmsLink(value, context);
  };

  const validate = (raw?: string | null): CmsLinkValidation => {
    const value = raw?.trim() || "";
    if (!value) {
      return { status: "missing", label: "Ingen lenke valgt" };
    }
    return validateCmsLink(value, context);
  };

  return { context, resolve, validate };
}

export function useCmsLinkContext(): CmsLinkContext {
  const { pages } = useCms();
  return useMemo(() => buildLinkContext(pages), [pages]);
}
