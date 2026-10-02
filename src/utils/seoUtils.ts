/**
 * SEO & Social Metadata Utilities
 * Conforms to applet-seo skill guidelines for dynamic injection into document head:
 * - <title> and <meta name="description">
 * - OpenGraph tags (og:title, og:description, og:image, og:url, og:type, og:site_name)
 * - Twitter / X Cards (twitter:card, twitter:title, twitter:description, twitter:image)
 * - Canonical link (<link rel="canonical">)
 * - Schema.org JSON-LD structured data (<script type="application/ld+json">)
 */

export interface PageSeoConfig {
  title?: string;
  metaDescription?: string;
  ogImage?: string;
  heroImage?: string;
  summary?: string;
  slug?: string;
  canonicalUrl?: string;
  churchName?: string;
  siteName?: string;
  type?: "website" | "article";
}

const DEFAULT_CHURCH_NAME = "Lillesand Misjonskirke";
const DEFAULT_SITE_TITLE = "Menighetsplan";
const DEFAULT_DESCRIPTION =
  "Enkel og varm handlingsportal for frivillige i menigheten til å se, ta og håndtere oppgaver.";
const SCHEMA_SCRIPT_ID = "cms-page-seo-schema";

function setOrCreateMeta(
  attrName: "name" | "property",
  attrValue: string,
  content: string
): () => void {
  if (typeof document === "undefined") return () => {};

  const selector = `meta[${attrName}="${attrValue}"]`;
  let meta = document.head.querySelector<HTMLMetaElement>(selector);
  const existedBefore = Boolean(meta);
  const previousContent = meta ? meta.getAttribute("content") : null;

  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attrName, attrValue);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);

  return () => {
    if (!meta) return;
    if (existedBefore && previousContent !== null) {
      meta.setAttribute("content", previousContent);
    } else if (!existedBefore && meta.parentNode) {
      meta.parentNode.removeChild(meta);
    }
  };
}

function setOrCreateLink(rel: string, href: string): () => void {
  if (typeof document === "undefined") return () => {};

  const selector = `link[rel="${rel}"]`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  const existedBefore = Boolean(link);
  const previousHref = link ? link.getAttribute("href") : null;

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);

  return () => {
    if (!link) return;
    if (existedBefore && previousHref !== null) {
      link.setAttribute("href", previousHref);
    } else if (!existedBefore && link.parentNode) {
      link.parentNode.removeChild(link);
    }
  };
}

function injectSchemaJsonLd(schemaData: object): () => void {
  if (typeof document === "undefined") return () => {};

  let script = document.getElementById(SCHEMA_SCRIPT_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement("script");
    script.id = SCHEMA_SCRIPT_ID;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.text = JSON.stringify(schemaData, null, 2);

  return () => {
    const existing = document.getElementById(SCHEMA_SCRIPT_ID);
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
  };
}

/**
 * Injects SEO and OpenGraph metadata into the document <head>.
 * Returns a teardown function that restores previous head state when component unmounts.
 */
export function injectPageSeo(config: PageSeoConfig): () => void {
  if (typeof document === "undefined") return () => {};

  const cleanups: Array<() => void> = [];
  const churchName = config.churchName || DEFAULT_CHURCH_NAME;
  const siteName = config.siteName || DEFAULT_SITE_TITLE;

  // 1. Title: specific, branded, avoid placeholders
  const pageTitle = config.title
    ? `${config.title} – ${churchName}`
    : `${siteName} – ${churchName}`;
  const previousDocumentTitle = document.title;
  document.title = pageTitle;
  cleanups.push(() => {
    document.title = previousDocumentTitle || `${siteName} – ${churchName}`;
  });

  // 2. Meta description (fallback priority: metaDescription -> summary -> default)
  const description =
    config.metaDescription?.trim() ||
    config.summary?.trim() ||
    (config.title
      ? `Velkommen til ${config.title} i ${churchName}.`
      : DEFAULT_DESCRIPTION);

  cleanups.push(setOrCreateMeta("name", "description", description));

  // 3. OpenGraph tags
  cleanups.push(setOrCreateMeta("property", "og:title", pageTitle));
  cleanups.push(setOrCreateMeta("property", "og:description", description));
  cleanups.push(setOrCreateMeta("property", "og:type", config.type || "website"));
  cleanups.push(setOrCreateMeta("property", "og:site_name", churchName));

  const pageUrl =
    config.canonicalUrl ||
    (typeof window !== "undefined"
      ? window.location.origin + window.location.pathname
      : "");
  if (pageUrl) {
    cleanups.push(setOrCreateMeta("property", "og:url", pageUrl));
    cleanups.push(setOrCreateLink("canonical", pageUrl));
  }

  // Resolved OG Image: fallback priority: ogImage -> heroImage -> church/app default icon
  const resolvedImage =
    config.ogImage?.trim() ||
    config.heroImage?.trim() ||
    (typeof window !== "undefined" ? `${window.location.origin}/icon.svg` : "/icon.svg");

  if (resolvedImage) {
    cleanups.push(setOrCreateMeta("property", "og:image", resolvedImage));
  }

  // 4. Twitter / X Cards
  cleanups.push(setOrCreateMeta("name", "twitter:card", "summary_large_image"));
  cleanups.push(setOrCreateMeta("name", "twitter:title", pageTitle));
  cleanups.push(setOrCreateMeta("name", "twitter:description", description));
  if (resolvedImage) {
    cleanups.push(setOrCreateMeta("name", "twitter:image", resolvedImage));
  }

  // 5. Schema.org JSON-LD
  const schemaPayload = {
    "@context": "https://schema.org",
    "@type": config.type === "article" ? "Article" : "WebPage",
    name: config.title || siteName,
    headline: config.title || siteName,
    description: description,
    url: pageUrl,
    ...(resolvedImage ? { image: resolvedImage } : {}),
    publisher: {
      "@type": "Church",
      name: churchName,
      url: typeof window !== "undefined" ? window.location.origin : "",
    },
  };
  cleanups.push(injectSchemaJsonLd(schemaPayload));

  return () => {
    // Run cleanup functions in reverse order
    for (let i = cleanups.length - 1; i >= 0; i--) {
      try {
        cleanups[i]();
      } catch {
        // Ignore teardown errors
      }
    }
  };
}
