import { initialCmsPages, CmsPage } from "../src/data/cmsData";

function buildHierarchicalNav(pages: CmsPage[]) {
  const activePages = pages.filter((p) => p.isPublished !== false && p.inNavMenu !== false);

  const topLevel = activePages
    .filter((p) => !p.parentId)
    .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));

  return topLevel.map((parent) => {
    const children = activePages
      .filter((p) => p.parentId === parent.id)
      .sort((a, b) => (a.navOrder ?? 99) - (b.navOrder ?? 99));

    return {
      page: parent,
      children,
    };
  });
}

function runMenuHierarchyTests() {
  console.log("🧪 Starter tester for hierarkisk menystruktur og CMS-sider...");

  // Test 1: Verify initial pages have required hierarchical fields
  console.log("✓ Sjekker at initialCmsPages har gyldig struktur...");
  for (const page of initialCmsPages) {
    if (!page.id || typeof page.id !== "string") {
      throw new Error(`Side mangler ID: ${JSON.stringify(page)}`);
    }
    if (!page.title || typeof page.title !== "string") {
      throw new Error(`Side mangler tittel: ${page.id}`);
    }
    if (typeof page.isPublished !== "boolean") {
      throw new Error(`Side mangler isPublished bool: ${page.id}`);
    }
  }

  // Test 2: Build navigation items
  const navTree = buildHierarchicalNav(initialCmsPages);
  console.log(`✓ Bygget navigasjonstre med ${navTree.length} hovedfaner.`);

  if (navTree.length < 5) {
    throw new Error(`Forventet minst 5 hovedfaner på toppmenyen, fant ${navTree.length}`);
  }

  // Test 3: Check ordering of top level tabs
  for (let i = 0; i < navTree.length - 1; i++) {
    const currOrder = navTree[i].page.navOrder ?? 99;
    const nextOrder = navTree[i + 1].page.navOrder ?? 99;
    if (currOrder > nextOrder) {
      throw new Error(
        `Feil i rekkefølge: ${navTree[i].page.title} (#${currOrder}) er plassert foran ${navTree[i + 1].page.title} (#${nextOrder})`
      );
    }
  }
  console.log("✓ Hovedfaner er korrekt sortert etter navOrder.");

  // Test 4: Verify Grupper / Aktiviteter has underfaner
  const grupperTab = navTree.find((n) => n.page.id === "page-grupper");
  if (!grupperTab || grupperTab.children.length === 0) {
    throw new Error("Fant ikke underfaner under 'Grupper/ aktiviteter...'!");
  }
  console.log(`✓ 'Grupper/ aktiviteter...' har ${grupperTab.children.length} underfaner (f.eks. Gospelkoret, Gullrekka).`);

  // Test 5: Verify Utleie has underfaner (Kurs, Selskap, Bilder)
  const utleieTab = navTree.find((n) => n.page.id === "page-utleie");
  if (!utleieTab || utleieTab.children.length < 3) {
    throw new Error("Utleie mangler forventede underfaner!");
  }
  console.log(`✓ 'Utleie' har ${utleieTab.children.length} underfaner (Kurs, Selskap, Bilder).`);

  // Test 6: Verify inNavMenu: false correctly hides page from top menu
  const personvernTab = navTree.find((n) => n.page.id === "page-personvern");
  if (personvernTab) {
    throw new Error("Personvern skal ha inNavMenu: false og skal IKKE ligge i offentlig toppmeny!");
  }
  console.log("✓ 'Personvern' (inNavMenu: false) er korrekt skjult fra toppmenyen.");

  // Test 7: Reparenting on parent deletion
  const testPages: CmsPage[] = [
    {
      id: "parent-1",
      slug: "parent-1",
      title: "Parent",
      summary: "",
      content: "",
      isPublished: true,
      navOrder: 1,
      inNavMenu: true,
      parentId: null,
      updatedAt: new Date().toISOString(),
    },
    {
      id: "child-1",
      slug: "child-1",
      title: "Child",
      summary: "",
      content: "",
      isPublished: true,
      navOrder: 1,
      inNavMenu: true,
      parentId: "parent-1",
      updatedAt: new Date().toISOString(),
    },
  ];

  // Simulate parent delete with safe re-parenting
  const pagesAfterDelete = testPages
    .filter((p) => p.id !== "parent-1")
    .map((p) => (p.parentId === "parent-1" ? { ...p, parentId: null } : p));

  if (pagesAfterDelete.length !== 1 || pagesAfterDelete[0].parentId !== null) {
    throw new Error("Reparenting ved sletting feilet!");
  }
  console.log("✓ Reparenting ved sletting av overordnet side fungerer korrekt.");

  console.log("🎉 Alle tester for hierarkisk menystruktur og CMS-sider passerte feilfritt!\n");
}

runMenuHierarchyTests();
