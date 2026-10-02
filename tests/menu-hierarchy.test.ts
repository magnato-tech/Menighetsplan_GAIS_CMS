import { describe } from "vitest";
import { assert } from "./assert";
import { initialCmsPages, type CmsPage } from "../src/data/cmsData";
import { buildPageTree, buildPublicMenu, findOrphanPages, withoutPage, pageUrl } from "../src/utils/menu";

describe("Menystruktur og CMS-sider", () => {
  const page = (id: string, extra: Partial<CmsPage> = {}): CmsPage => ({
    id,
    slug: id,
    title: id,
    summary: "",
    content: "",
    isPublished: true,
    inNavMenu: true,
    parentId: null,
    navOrder: 1,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  });
  const ids = (list: CmsPage[]) => list.map((p) => p.id).join(",");

  // 1. The demo pages are well-formed
  assert(
    initialCmsPages.every((p) => typeof p.id === "string" && p.id !== "" && typeof p.title === "string" && p.title !== ""),
    "Alle demosidene har ID og tittel"
  );
  assert(
    initialCmsPages.every((p) => typeof p.isPublished === "boolean"),
    "Alle demosidene sier om de er publisert"
  );
  assert(new Set(initialCmsPages.map((p) => p.id)).size === initialCmsPages.length, "Demosidene har unike ID-er");
  assert(findOrphanPages(initialCmsPages).length === 0, "Ingen demoside peker på en overordnet side som mangler");

  // 2. The public menu built from the demo pages
  const menu = buildPublicMenu(initialCmsPages);
  assert(menu.length >= 5, `Toppmenyen har minst 5 hovedfaner (fant ${menu.length})`);
  assert(
    menu.every((node, i) => i === 0 || (menu[i - 1].page.navOrder ?? 99) <= (node.page.navOrder ?? 99)),
    "Hovedfanene står i menyrekkefølge"
  );
  const grupper = menu.find((n) => n.page.id === "page-grupper");
  assert(grupper !== undefined && grupper.children.length > 0, "Grupper og aktiviteter har underfaner");
  const utleie = menu.find((n) => n.page.id === "page-utleie");
  assert(utleie !== undefined && utleie.children.length >= 3, "Utleie har underfanene kurs, selskap og bilder");
  assert(!menu.some((n) => n.page.id === "page-personvern"), "Personvern (inNavMenu: false) står ikke i toppmenyen");

  // 3. Ordering and the two levels
  const unsorted = [
    page("b", { navOrder: 2 }),
    page("uten-rekkefolge", { navOrder: undefined }),
    page("a", { navOrder: 1 }),
    page("a2", { parentId: "a", navOrder: 2 }),
    page("a1", { parentId: "a", navOrder: 1 }),
  ];
  const tree = buildPageTree(unsorted);
  assert(ids(tree.map((n) => n.page)) === "a,b,uten-rekkefolge", "En side uten menyrekkefølge havner sist");
  assert(ids(tree[0].children) === "a1,a2", "Underfaner sorteres etter menyrekkefølge");
  assert(tree[1].children.length === 0, "En hovedfane uten underfaner får en tom liste");
  assert(ids(unsorted) === "b,uten-rekkefolge,a,a2,a1", "buildPageTree endrer ikke listen den får inn");

  // 4. What the public menu leaves out, and what the admin tree keeps
  const mixed = [
    page("synlig"),
    page("kladd", { isPublished: false }),
    page("skjult", { inNavMenu: false }),
    page("synlig-barn", { parentId: "synlig" }),
    page("kladd-barn", { parentId: "synlig", isPublished: false }),
    page("barn-av-kladd", { parentId: "kladd" }),
  ];
  const publicMenu = buildPublicMenu(mixed);
  assert(ids(publicMenu.map((n) => n.page)) === "synlig", "Kladder og sider skjult fra menyen vises ikke i den offentlige menyen");
  assert(ids(publicMenu[0].children) === "synlig-barn", "En underfane som er kladd vises ikke i den offentlige menyen");
  assert(buildPageTree(mixed).length === 3, "Admin-treet viser også kladder og skjulte sider");
  assert(
    ids(buildPageTree(mixed).find((n) => n.page.id === "kladd")?.children ?? []) === "barn-av-kladd",
    "Admin-treet viser underfanene til en kladd"
  );

  // 5. Sub-pages nothing leads to
  const withOrphans = [
    page("topp"),
    page("barn", { parentId: "topp" }),
    page("foreldrelos", { parentId: "slettet-side" }),
    page("barnebarn", { parentId: "barn" }),
  ];
  assert(ids(findOrphanPages(withOrphans)) === "foreldrelos,barnebarn", "En underfane uten gyldig hovedfane regnes som frittstående");
  assert(
    !buildPageTree(withOrphans).some((n) => n.page.id === "foreldrelos" || n.children.some((c) => c.id === "foreldrelos")),
    "En frittstående side står ikke i treet"
  );

  // 6. Deleting a page
  const family = [page("forelder"), page("barn-1", { parentId: "forelder" }), page("barn-2", { parentId: "forelder" }), page("annen")];
  const afterParentDelete = withoutPage(family, "forelder");
  assert(ids(afterParentDelete) === "barn-1,barn-2,annen", "Sletting fjerner bare siden selv");
  assert(
    afterParentDelete.every((p) => p.parentId === null),
    "Underfanene til en slettet hovedfane blir hovedfaner"
  );
  assert(findOrphanPages(afterParentDelete).length === 0, "Sletting av en hovedfane etterlater ingen frittstående sider");
  assert(family[1].parentId === "forelder", "withoutPage endrer ikke sidene den får inn");
  const afterChildDelete = withoutPage(family, "barn-1");
  assert(
    ids(afterChildDelete) === "forelder,barn-2,annen" && afterChildDelete[1].parentId === "forelder",
    "Sletting av en underfane rører ikke søsknene"
  );

  // 7. Where a page lives
  assert(pageUrl({ slug: "om-oss" }) === "/om-oss", "En side ligger under sin egen slug");
  assert(pageUrl({ slug: "kalender", linkUrl: "/hva-skjer" }) === "/hva-skjer", "linkUrl overstyrer slug");
  assert(pageUrl({ slug: "" }) === "/", "En side uten slug er forsiden");
});
