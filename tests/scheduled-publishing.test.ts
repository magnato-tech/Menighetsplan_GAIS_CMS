// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { isPagePublished, buildPublicMenu } from "../src/utils/menu";
import { CmsPage } from "../src/data/cmsData";

describe("Planlagt publisering (Scheduled Publishing)", () => {
  const basePage: CmsPage = {
    id: "p1",
    slug: "planlagt-side",
    title: "Planlagt side",
    summary: "Ingress",
    content: "Innhold",
    isPublished: true,
    status: "published",
    inNavMenu: true,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("identifies currently published pages correctly", () => {
    // Normal published page
    expect(isPagePublished(basePage)).toBe(true);

    // Draft page
    expect(isPagePublished({ ...basePage, isPublished: false })).toBe(false);
    expect(isPagePublished({ ...basePage, status: "draft" })).toBe(false);
  });

  it("holds back future-scheduled pages until the scheduled date has passed", () => {
    const fixedNow = new Date("2026-10-02T12:00:00.000Z");

    // Page scheduled 2 hours into the future
    const futurePage: CmsPage = {
      ...basePage,
      publishAt: "2026-10-02T14:00:00.000Z",
    };
    expect(isPagePublished(futurePage, fixedNow)).toBe(false);

    // Page scheduled 2 hours in the past
    const pastPage: CmsPage = {
      ...basePage,
      publishAt: "2026-10-02T10:00:00.000Z",
    };
    expect(isPagePublished(pastPage, fixedNow)).toBe(true);
  });

  it("filters out future-scheduled pages from the public navigation menu", () => {
    const fixedNow = new Date("2026-10-02T12:00:00.000Z");

    const pages: CmsPage[] = [
      { ...basePage, id: "live", title: "Aktiv side" },
      {
        ...basePage,
        id: "future",
        title: "Fremtidig side",
        publishAt: "2026-10-03T10:00:00.000Z",
      },
      {
        ...basePage,
        id: "past-scheduled",
        title: "Tidligere planlagt",
        publishAt: "2026-10-01T10:00:00.000Z",
      },
      { ...basePage, id: "draft", title: "Kladd", isPublished: false },
    ];

    const publicMenu = buildPublicMenu(pages, fixedNow);
    const visibleIds = publicMenu.map((node) => node.page.id);

    expect(visibleIds).toContain("live");
    expect(visibleIds).toContain("past-scheduled");
    expect(visibleIds).not.toContain("future");
    expect(visibleIds).not.toContain("draft");
  });
});
