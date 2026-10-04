/**
 * Puts a page's search and sharing details into the document head while the page is shown:
 * - <title> and <meta name="description">
 * - OpenGraph tags (og:title, og:description, og:image, og:url, og:type, og:site_name)
 * - Twitter / X Cards (twitter:card, twitter:title, twitter:description, twitter:image)
 * - Canonical link (<link rel="canonical">)
 * - Schema.org JSON-LD structured data (<script type="application/ld+json">)
 *
 * What the details are is decided in siteSeo.ts, which the server uses too.
 */
import { PageSeoConfig, resolvePageSeo } from "./siteSeo";

export { shareableImageUrl } from "./siteSeo";
export type { PageSeoConfig } from "./siteSeo";

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
export function injectPageSeo(
  config: PageSeoConfig,
  media: import("../data/cmsData").CmsMedia[] = []
): () => void {
  if (typeof document === "undefined") return () => {};

  const seo = resolvePageSeo(config, window.location.origin, window.location.pathname, media);
  const cleanups: Array<() => void> = [];

  const previousDocumentTitle = document.title;
  document.title = seo.title;
  cleanups.push(() => {
    document.title = previousDocumentTitle || seo.title;
  });

  cleanups.push(setOrCreateMeta("name", "description", seo.description));
  // An address without a page is left out of search results
  cleanups.push(setOrCreateMeta("name", "robots", seo.notFound ? "noindex" : "index, follow"));

  cleanups.push(setOrCreateMeta("property", "og:title", seo.title));
  cleanups.push(setOrCreateMeta("property", "og:description", seo.description));
  cleanups.push(setOrCreateMeta("property", "og:type", seo.type));
  cleanups.push(setOrCreateMeta("property", "og:site_name", seo.siteName));
  cleanups.push(setOrCreateMeta("property", "og:url", seo.url));
  cleanups.push(setOrCreateLink("canonical", seo.url));
  cleanups.push(setOrCreateMeta("property", "og:image", seo.image));

  cleanups.push(setOrCreateMeta("name", "twitter:card", "summary_large_image"));
  cleanups.push(setOrCreateMeta("name", "twitter:title", seo.title));
  cleanups.push(setOrCreateMeta("name", "twitter:description", seo.description));
  cleanups.push(setOrCreateMeta("name", "twitter:image", seo.image));

  cleanups.push(
    injectSchemaJsonLd({
      "@context": "https://schema.org",
      "@type": seo.type === "article" ? "Article" : "WebPage",
      name: config.title || seo.title,
      headline: config.title || seo.title,
      description: seo.description,
      url: seo.url,
      image: seo.image,
      publisher: {
        "@type": "Church",
        name: seo.siteName,
        url: window.location.origin,
      },
    })
  );

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
