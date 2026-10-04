import { describe, expect, test } from "vitest";
import type { CmsNewsArticle, CmsPage } from "../src/data/cmsData";
import { isMinSidePath, isPublicPath } from "../src/utils/routes";
import { SiteContent, resolvePageSeo, seoForPath, shareableImageUrl } from "../src/utils/siteSeo";
import { markAsPrivate, renderSeoIntoHtml } from "../server/pageMeta";

const ORIGIN = "https://kirken.example";
const NOW = new Date("2026-10-03T10:00:00Z");

const page = (fields: Partial<CmsPage> & { id: string; slug: string; title: string }): CmsPage => ({
  summary: "",
  content: "",
  isPublished: true,
  updatedAt: "2026-10-01T10:00:00Z",
  ...fields,
});

const article = (fields: Partial<CmsNewsArticle> & { id: string; title: string }): CmsNewsArticle => ({
  slug: fields.id,
  summary: "",
  content: "",
  category: "aktuelt",
  author: "Menigheten",
  publishedAt: "2026-10-01T10:00:00Z",
  isPublished: true,
  ...fields,
});

const site: SiteContent = {
  settings: {
    churchName: "Storvik Frikirke",
    appName: "Menighetsplan",
    tagline: "Åpen kirke midt i byen",
    welcomeSubtext: "Gudstjeneste hver søndag kl. 11.",
  },
  pages: [
    page({ id: "forside", slug: "", title: "Forside", linkUrl: "/", ogImage: "https://bilder.example/forside.jpg" }),
    page({ id: "kalender", slug: "hva-skjer", title: "Kalender", linkUrl: "/hva-skjer", summary: "Alt som skjer hos oss." }),
    page({
      id: "om-oss",
      slug: "om-oss",
      title: "Om menigheten",
      summary: "Hvem vi er.",
      metaDescription: "Bli kjent med Storvik Frikirke.",
      heroImage: "https://bilder.example/om-oss.jpg",
    }),
    page({ id: "daap", slug: "daap", title: "Dåp", heroImage: "data:image/jpeg;base64,AAAA" }),
    page({ id: "kladd", slug: "kladd", title: "Uferdig side", isPublished: false }),
    page({ id: "senere", slug: "julekonsert", title: "Julekonsert", publishAt: "2026-12-01T08:00:00Z" }),
  ],
  news: [
    article({ id: "news-1", title: "Høstfest", slug: "hostfest", summary: "Velkommen til høstfest.", imageUrl: "https://bilder.example/fest.jpg" }),
    article({ id: "news-2", title: "Ikke klar", isPublished: false }),
  ],
  media: [],
};

const seoAt = (path: string) => {
  const config = seoForPath(path, site, NOW);
  return config && resolvePageSeo(config, ORIGIN, path, site.media);
};

describe("Hvilke adresser som hører til nettsiden", () => {
  test("Min side, admin og API-et er ikke en del av nettsiden", () => {
    for (const path of ["/minside", "/leder", "/oppgave/task-1", "/admin", "/admin/person/p1", "/api/public/all"]) {
      expect(isPublicPath(path), path).toBe(false);
    }
  });

  test("Forsiden, de innebygde sidene og CMS-sidene er det", () => {
    for (const path of ["/", "/hva-skjer", "/taler", "/om-oss", "/side/daap", "/artikkel/news-1"]) {
      expect(isPublicPath(path), path).toBe(true);
    }
  });

  test("«/lederskap» er en offentlig side, selv om «/leder» er Min side", () => {
    expect(isMinSidePath("/leder")).toBe(true);
    expect(isMinSidePath("/leder/gruppe/g1")).toBe(true);
    expect(isMinSidePath("/lederskap")).toBe(false);
    expect(isPublicPath("/lederskap")).toBe(true);
  });
});

describe("Tittel, beskrivelse og delebilde for hver adresse", () => {
  test("Forsiden bærer menighetens navn og slagord", () => {
    const seo = seoAt("/")!;
    expect(seo.title).toBe("Storvik Frikirke – Åpen kirke midt i byen");
    expect(seo.description).toBe("Gudstjeneste hver søndag kl. 11.");
    expect(seo.image).toBe("https://bilder.example/forside.jpg");
    expect(seo.url).toBe("https://kirken.example/");
    expect(seo.notFound).toBe(false);
  });

  test("En CMS-side bruker sin egen beskrivelse, ellers ingressen", () => {
    const about = seoAt("/om-oss")!;
    expect(about.title).toBe("Om menigheten – Storvik Frikirke");
    expect(about.description).toBe("Bli kjent med Storvik Frikirke.");
    expect(about.image).toBe("https://bilder.example/om-oss.jpg");

    const calendar = seoAt("/hva-skjer")!;
    expect(calendar.title).toBe("Kalender – Storvik Frikirke");
    expect(calendar.description).toBe("Alt som skjer hos oss.");
  });

  test("Siden finnes på alle adressene den kan nås på", () => {
    for (const path of ["/om-oss", "/om-oss/", "/side/om-oss", "/nettside/om-oss", "/Om-Oss"]) {
      expect(seoAt(path)!.title, path).toBe("Om menigheten – Storvik Frikirke");
    }
  });

  test("En innebygd side uten egen CMS-side får navn og beskrivelse likevel", () => {
    expect(seoAt("/taler")!.title).toBe("Taler – Storvik Frikirke");
    expect(seoAt("/taler")!.description).toBe("Taler og prekener fra Storvik Frikirke.");
    expect(seoAt("/lederskap")!.title).toBe("Lederskap – Storvik Frikirke");
    expect(seoAt("/taler")!.notFound).toBe(false);
  });

  test("Et opplastet hovedbilde blir ikke delebilde", () => {
    expect(seoAt("/daap")!.image).toBe("https://kirken.example/icon.svg");
    expect(shareableImageUrl("data:image/png;base64,AAAA", ORIGIN)).toBeUndefined();
    expect(shareableImageUrl("/bilder/kirke.jpg", ORIGIN)).toBe("https://kirken.example/bilder/kirke.jpg");
    expect(shareableImageUrl("//annet.example/x.jpg", ORIGIN)).toBeUndefined();
  });

  test("En kladd og en side som er planlagt senere, finnes ikke ennå", () => {
    for (const path of ["/kladd", "/julekonsert", "/finnes-ikke"]) {
      const seo = seoAt(path)!;
      expect(seo.notFound, path).toBe(true);
      expect(seo.title, path).toBe("Siden ble ikke funnet – Storvik Frikirke");
    }
  });

  test("En planlagt side finnes når tidspunktet er passert", () => {
    const later = seoForPath("/julekonsert", site, new Date("2026-12-01T08:00:01Z"))!;
    expect(later.title).toBe("Julekonsert");
    expect(later.notFound).toBeUndefined();
  });

  test("En artikkel finnes på både ID og adresse, men ikke som kladd", () => {
    for (const path of ["/artikkel/news-1", "/artikkel/hostfest", "/artikkel/HOSTFEST"]) {
      const seo = seoAt(path)!;
      expect(seo.title, path).toBe("Høstfest – Storvik Frikirke");
      expect(seo.type).toBe("article");
      expect(seo.image).toBe("https://bilder.example/fest.jpg");
    }
    expect(seoAt("/artikkel/news-2")!.notFound).toBe(true);
    expect(seoAt("/artikkel/ukjent")!.notFound).toBe(true);
  });

  test("Min side og admin har ingen delingskort", () => {
    expect(seoForPath("/minside", site, NOW)).toBeNull();
    expect(seoForPath("/admin", site, NOW)).toBeNull();
  });
});

describe("HTML-en serveren sender", () => {
  const indexHtml = `<!doctype html>
<html lang="no">
  <head>
    <meta charset="UTF-8" />
    <title>Menighetsplan</title>
    <meta name="description" content="Standardtekst" />
    <meta property="og:title" content="Menighetsplan" />
    <meta property="og:type" content="website" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
  </head>
  <body><div id="root"></div></body>
</html>`;

  const count = (html: string, needle: string) => html.split(needle).length - 1;

  test("Sidens tittel, beskrivelse og delingskort står i HTML-en, én gang hver", () => {
    const html = renderSeoIntoHtml(indexHtml, seoAt("/om-oss")!);
    expect(html).toContain("<title>Om menigheten – Storvik Frikirke</title>");
    expect(html).toContain('<meta name="description" content="Bli kjent med Storvik Frikirke." />');
    expect(html).toContain('<meta property="og:image" content="https://bilder.example/om-oss.jpg" />');
    expect(html).toContain('<meta property="og:url" content="https://kirken.example/om-oss" />');
    expect(html).toContain('<link rel="canonical" href="https://kirken.example/om-oss" />');
    expect(html).toContain('<meta name="robots" content="index, follow" />');

    for (const once of ["<title>", 'name="description"', 'property="og:title"', 'property="og:type"']) {
      expect(count(html, once), once).toBe(1);
    }
    expect(html).not.toContain("Standardtekst");
    // The rest of the page is untouched
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/icon.svg" />');
    expect(html).toContain('<div id="root"></div>');
  });

  test("Tekst fra CMS-et kan ikke bli til kode i siden", () => {
    const seo = resolvePageSeo(
      { title: 'Fest</title><script>alert(1)</script>', summary: '"><img src=x onerror=alert(1)> & mer', churchName: "Kirken" },
      ORIGIN,
      "/fest"
    );
    const html = renderSeoIntoHtml(indexHtml, seo);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("Fest&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt; – Kirken");
    expect(html).toContain("&quot;&gt;&lt;img src=x onerror=alert(1)&gt; &amp; mer");
  });

  test("Et dollartegn i tittelen blir stående som det er", () => {
    const seo = resolvePageSeo({ title: "Basar: alt til $1 og $&", churchName: "Kirken" }, ORIGIN, "/basar");
    expect(renderSeoIntoHtml(indexHtml, seo)).toContain("<title>Basar: alt til $1 og $&amp; – Kirken</title>");
  });

  test("En adresse uten side holdes utenfor søkeresultatene", () => {
    expect(renderSeoIntoHtml(indexHtml, seoAt("/kladd")!)).toContain('<meta name="robots" content="noindex" />');
  });

  test("Min side og admin holdes utenfor søkeresultatene, og beholder appens tittel", () => {
    const html = markAsPrivate(indexHtml);
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toContain("<title>Menighetsplan</title>");
    expect(count(markAsPrivate(html), 'name="robots"')).toBe(1);
  });
});
