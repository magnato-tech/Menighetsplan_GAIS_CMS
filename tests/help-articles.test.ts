import { describe } from "vitest";
import { assert } from "./assert";
import { defaultHelpArticleId, findHelpArticle, helpArticles, helpSections } from "../src/pages/admin/help/articles";
import { helpArticleImageSrc } from "../src/pages/admin/help/HelpArticleView";
import { studioTabUrl } from "../src/pages/admin/studio";
import { existsSync } from "node:fs";
import path from "node:path";

describe("Hjelpeartikler", () => {
  const articles = helpArticles();
  const ids = articles.map((article) => article.id);

  assert(new Set(ids).size === ids.length, "Hver hjelpeartikkel har et unikt anker");
  assert(findHelpArticle(defaultHelpArticleId).id === defaultHelpArticleId, "Standardartikkelen finnes");
  assert(findHelpArticle("finnes-ikke").id === defaultHelpArticleId, "Ukjent anker åpner standardartikkelen");
  assert(
    helpSections[0]?.items.some((item) => item.kind === "menu" && item.title === "Sider & Innhold" && item.articles.length === 6),
    "Sider & Innhold har seks underpunkter"
  );
  assert(
    articles.every((article) => article.formal && article.hvor && article.steg.length > 0 && article.knapper && article.etterLagring),
    "Hver artikkel har formål, hvor, steg, knapper og etter lagring"
  );
  assert(
    articles.every((article) => article.layout === "wide" || article.layout === "tall"),
    "Hver artikkel har layout wide eller tall"
  );
  assert(
    articles.filter((article) => article.layout === "tall").map((article) => article.id).sort().join(",") ===
      "sider-hero,sider-innhold,sider-sok",
    "Høye bilder er hero, innhold og søk"
  );
  assert(
    studioTabUrl("cms-hjelp") === "/admin?tab=cms-hjelp",
    "Hjelpeartikler lenker til cms-hjelp, ikke en ukjent tab"
  );
  for (const article of articles) {
    const imagePath = path.join(process.cwd(), "public", helpArticleImageSrc(article.id).slice(1));
    assert(existsSync(imagePath), `Hjelpebilde finnes for ${article.id}`);
  }
});
