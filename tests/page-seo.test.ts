// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { injectPageSeo } from "../src/utils/seoUtils";
import { CmsPage } from "../src/data/cmsData";

describe("SEO & OpenGraph metadata injection (injectPageSeo)", () => {
  beforeEach(() => {
    document.title = "Opprinnelig tittel";
    // Clean up any test meta tags
    document.head.innerHTML = `
      <title>Opprinnelig tittel</title>
      <meta name="description" content="Opprinnelig standard beskrivelse" />
      <meta property="og:title" content="Opprinnelig standard tittel" />
    `;
  });

  afterEach(() => {
    document.head.innerHTML = "";
  });

  it("injects custom metaDescription, ogImage, and branded title into head", () => {
    const page: Partial<CmsPage> = {
      id: "page-om-oss",
      slug: "om-oss",
      title: "Om menigheten",
      summary: "Kort ingress om fellesskapet",
      metaDescription: "Spesifikk SEO-beskrivelse skrevet for Google søkeresultater.",
      ogImage: "https://example.com/custom-og.jpg",
      heroImage: "https://example.com/hero.jpg",
    };

    const cleanup = injectPageSeo({
      title: page.title,
      metaDescription: page.metaDescription,
      ogImage: page.ogImage,
      heroImage: page.heroImage,
      summary: page.summary,
      slug: page.slug,
      churchName: "Lillesand Misjonskirke",
      siteName: "Menighetsplan",
    });

    // 1. Title verification
    expect(document.title).toBe("Om menigheten – Lillesand Misjonskirke");

    // 2. Meta description
    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute("content")).toBe(
      "Spesifikk SEO-beskrivelse skrevet for Google søkeresultater."
    );

    // 3. OpenGraph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle?.getAttribute("content")).toBe("Om menigheten – Lillesand Misjonskirke");

    const ogDesc = document.querySelector('meta[property="og:description"]');
    expect(ogDesc?.getAttribute("content")).toBe(
      "Spesifikk SEO-beskrivelse skrevet for Google søkeresultater."
    );

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute("content")).toBe("https://example.com/custom-og.jpg");

    const ogType = document.querySelector('meta[property="og:type"]');
    expect(ogType?.getAttribute("content")).toBe("website");

    // 4. Twitter tags
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    expect(twitterCard?.getAttribute("content")).toBe("summary_large_image");

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    expect(twitterImage?.getAttribute("content")).toBe("https://example.com/custom-og.jpg");

    // 5. Schema.org JSON-LD
    const schemaScript = document.getElementById("cms-page-seo-schema") as HTMLScriptElement;
    expect(schemaScript).not.toBeNull();
    const schemaData = JSON.parse(schemaScript.text);
    expect(schemaData["@type"]).toBe("WebPage");
    expect(schemaData.name).toBe("Om menigheten");
    expect(schemaData.description).toBe(
      "Spesifikk SEO-beskrivelse skrevet for Google søkeresultater."
    );
    expect(schemaData.image).toBe("https://example.com/custom-og.jpg");

    // 6. Cleanup restoration
    cleanup();
    expect(document.title).toBe("Opprinnelig tittel");
    expect(document.getElementById("cms-page-seo-schema")).toBeNull();
  });

  it("gracefully falls back to summary and heroImage when metaDescription and ogImage are omitted", () => {
    const page: Partial<CmsPage> = {
      title: "Gudstjenester",
      summary: "Ingress om våre søndagssamlinger.",
      heroImage: "https://example.com/church-hall.jpg",
    };

    const cleanup = injectPageSeo({
      title: page.title,
      metaDescription: undefined,
      ogImage: undefined,
      heroImage: page.heroImage,
      summary: page.summary,
      churchName: "Lillesand Misjonskirke",
    });

    const descMeta = document.querySelector('meta[name="description"]');
    expect(descMeta?.getAttribute("content")).toBe("Ingress om våre søndagssamlinger.");

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute("content")).toBe("https://example.com/church-hall.jpg");

    cleanup();
  });

  it("handles full lifecycle injection of OpenGraph, Twitter and Schema.org for social media visibility", () => {
    const page: Partial<CmsPage> = {
      title: "Barn & Ungdom",
      slug: "ungdom",
      metaDescription: "Møt ungdomsmiljøet og Sprell Levende søndagsskole i kirken.",
      ogImage: "https://example.com/youth.jpg",
    };

    const cleanup = injectPageSeo({
      title: page.title,
      metaDescription: page.metaDescription,
      ogImage: page.ogImage,
      slug: page.slug,
      churchName: "Lillesand Misjonskirke",
      siteName: "Menighetsplan",
    });

    // Verify OpenGraph
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute("content")).toBe(
      "Barn & Ungdom – Lillesand Misjonskirke"
    );
    expect(document.querySelector('meta[property="og:description"]')?.getAttribute("content")).toBe(
      "Møt ungdomsmiljøet og Sprell Levende søndagsskole i kirken."
    );
    expect(document.querySelector('meta[property="og:image"]')?.getAttribute("content")).toBe(
      "https://example.com/youth.jpg"
    );

    // Verify Twitter
    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute("content")).toBe(
      "summary_large_image"
    );
    expect(document.querySelector('meta[name="twitter:image"]')?.getAttribute("content")).toBe(
      "https://example.com/youth.jpg"
    );

    cleanup();
  });
});

