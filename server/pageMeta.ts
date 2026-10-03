import type { ResolvedSeo } from "../src/utils/siteSeo";

// Writes a page's title, description and share card into the HTML the server sends.
// Services that show a link preview read the HTML as it arrives and never run the app,
// so what they need has to be there from the start.

// Titles and descriptions come from the CMS, so they are text and must not end up as markup
const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const meta = (attribute: "name" | "property", key: string, content: string) =>
  `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;

// What index.html has of the same kind is taken out, so nothing is said twice
const REPLACED = [
  /<title>[\s\S]*?<\/title>\s*/gi,
  /<meta\s+name="(?:description|robots|twitter:[^"]*)"[^>]*>\s*/gi,
  /<meta\s+property="og:[^"]*"[^>]*>\s*/gi,
  /<link\s+rel="canonical"[^>]*>\s*/gi,
];

function withHeadTags(html: string, tags: string[], remove: RegExp[]): string {
  const stripped = remove.reduce((text, pattern) => text.replace(pattern, ""), html);
  // A function, so that a "$" in a title is not read as a replacement pattern
  return stripped.replace(/<\/head>/i, () => `${tags.map((tag) => `  ${tag}\n  `).join("")}</head>`);
}

/** index.html with the page's own title, description, share card and canonical address. */
export function renderSeoIntoHtml(html: string, seo: ResolvedSeo): string {
  return withHeadTags(
    html,
    [
      `<title>${escapeHtml(seo.title)}</title>`,
      meta("name", "description", seo.description),
      meta("name", "robots", seo.notFound ? "noindex" : "index, follow"),
      meta("property", "og:title", seo.title),
      meta("property", "og:description", seo.description),
      meta("property", "og:type", seo.type),
      meta("property", "og:site_name", seo.siteName),
      meta("property", "og:url", seo.url),
      meta("property", "og:image", seo.image),
      meta("name", "twitter:card", "summary_large_image"),
      meta("name", "twitter:title", seo.title),
      meta("name", "twitter:description", seo.description),
      meta("name", "twitter:image", seo.image),
      `<link rel="canonical" href="${escapeHtml(seo.url)}" />`,
    ],
    REPLACED
  );
}

/** index.html for Min side and admin, which search engines are asked to leave out. */
export function markAsPrivate(html: string): string {
  return withHeadTags(html, [meta("name", "robots", "noindex")], [/<meta\s+name="robots"[^>]*>\s*/gi]);
}
