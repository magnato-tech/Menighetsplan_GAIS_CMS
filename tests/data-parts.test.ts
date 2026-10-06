import { describe, expect, test } from "vitest";
import { CMS_COLLECTIONS, COLLECTIONS } from "../src/data/collections";
import { calendarGroupIds, countByPart, documentsToDelete, isWebsiteGathering, keepParts, partOf } from "../src/utils/dataParts";

const open = { type: "arrangement", visibility: "offentlig", isPublic: true };

const collections = {
  [CMS_COLLECTIONS.PAGES]: [{ id: "page-forside" }],
  [CMS_COLLECTIONS.SETTINGS]: [{ id: "global", churchName: "Lillesand Misjonskirke" }],
  [COLLECTIONS.PERSONS]: [{ id: "p1" }],
  [COLLECTIONS.GROUPS]: [
    { id: "kalender", memberIds: [], leaderIds: [] },
    { id: "lovsang", memberIds: ["p1"], leaderIds: [] },
    { id: "tom", memberIds: [], leaderIds: [] },
  ],
  [COLLECTIONS.GATHERINGS]: [
    { id: "gudstjeneste", groupId: "kalender", ...open },
    { id: "konsert", groupId: "lovsang", ...open },
    { id: "ovelse", groupId: "lovsang", type: "gruppesamling", visibility: "offentlig", isPublic: true },
    { id: "styremote", groupId: "lovsang", type: "arrangement", visibility: "intern", isPublic: false },
  ],
  [COLLECTIONS.TASKS]: [
    { id: "t-gudstjeneste", gatheringId: "gudstjeneste" },
    { id: "t-ovelse", gatheringId: "ovelse" },
  ],
  [COLLECTIONS.ASSIGNMENTS]: [
    { id: "a-gudstjeneste", taskId: "t-gudstjeneste", personId: "p1" },
    { id: "a-ovelse", taskId: "t-ovelse", personId: "p1" },
  ],
  [COLLECTIONS.GATHERING_HEADCOUNTS]: [{ id: "h-gudstjeneste", gatheringId: "gudstjeneste" }],
  [COLLECTIONS.VOLUNTEER_ROLES]: [{ id: "role-lyd" }],
};

const idsIn = (kept: Record<string, { id: string }[]>, name: string) => (kept[name] ?? []).map((d) => d.id);

describe("Nettsiden og planleggeren", () => {
  test("et arrangement åpent for alle er nettsidens; en gruppesamling og et internt møte er planleggerens", () => {
    expect(isWebsiteGathering({ id: "a", ...open })).toBe(true);
    expect(isWebsiteGathering({ id: "b", type: "gruppesamling", visibility: "offentlig" })).toBe(false);
    expect(isWebsiteGathering({ id: "c", type: "arrangement", visibility: "intern" })).toBe(false);
  });

  test("en gruppe følger nettsiden bare når den er uten medlemmer og bare eier åpne arrangementer", () => {
    // «tom» eier ingenting, og «lovsang» har medlemmer
    expect([...calendarGroupIds(collections)]).toEqual(["kalender"]);
    const withInternal = {
      ...collections,
      [COLLECTIONS.GATHERINGS]: [...collections[COLLECTIONS.GATHERINGS], { id: "dugnad", groupId: "kalender", type: "arrangement", visibility: "intern" }],
    };
    expect([...calendarGroupIds(withInternal)]).toEqual([]);
  });

  test("hvert dokument hører til nøyaktig én del", () => {
    const calendarGroups = calendarGroupIds(collections);
    expect(partOf(CMS_COLLECTIONS.PAGES, { id: "page-forside" }, calendarGroups)).toBe("website");
    expect(partOf(COLLECTIONS.PERSONS, { id: "p1" }, calendarGroups)).toBe("planner");
    expect(partOf(COLLECTIONS.VOLUNTEER_ROLES, { id: "role-lyd" }, calendarGroups)).toBe("planner");
    expect(partOf(COLLECTIONS.GROUPS, { id: "kalender" }, calendarGroups)).toBe("website");
    expect(partOf(COLLECTIONS.GROUPS, { id: "lovsang" }, calendarGroups)).toBe("planner");

    const counts = countByPart(collections);
    const total = Object.values(collections).reduce((sum, documents) => sum + documents.length, 0);
    expect(counts).toEqual({ website: 5, planner: total - 5 });
  });

  test("utvalget per del beholder dokumentene urørt og dropper tomme samlinger", () => {
    const website = keepParts(collections, ["website"]);
    expect(Object.keys(website).sort()).toEqual(
      [CMS_COLLECTIONS.PAGES, CMS_COLLECTIONS.SETTINGS, COLLECTIONS.GATHERINGS, COLLECTIONS.GROUPS].sort()
    );
    expect(idsIn(website, COLLECTIONS.GATHERINGS)).toEqual(["gudstjeneste", "konsert"]);
    expect(idsIn(website, COLLECTIONS.GROUPS)).toEqual(["kalender"]);

    const planner = keepParts(collections, ["planner"]);
    expect(idsIn(planner, COLLECTIONS.GATHERINGS)).toEqual(["ovelse", "styremote"]);
    expect(idsIn(planner, COLLECTIONS.GROUPS)).toEqual(["lovsang", "tom"]);
    expect(planner[CMS_COLLECTIONS.PAGES]).toBeUndefined();

    expect(keepParts(collections, ["website", "planner"])).toEqual(collections);
    expect(keepParts(collections, [])).toEqual({});
  });

  test("tømmes nettsiden, følger oppgavene, tildelingene og oppmøtetallene på arrangementene med", () => {
    const doomed = documentsToDelete(collections, ["website"]).map((d) => `${d.collection}/${d.id}`);

    expect(doomed).toContain(`${COLLECTIONS.GATHERINGS}/gudstjeneste`);
    expect(doomed).toContain(`${COLLECTIONS.TASKS}/t-gudstjeneste`);
    expect(doomed).toContain(`${COLLECTIONS.ASSIGNMENTS}/a-gudstjeneste`);
    expect(doomed).toContain(`${COLLECTIONS.GATHERING_HEADCOUNTS}/h-gudstjeneste`);
    // What hangs on the planner's own gatherings stays, and so do the persons and the roles
    for (const kept of [
      `${COLLECTIONS.TASKS}/t-ovelse`,
      `${COLLECTIONS.ASSIGNMENTS}/a-ovelse`,
      `${COLLECTIONS.GATHERINGS}/ovelse`,
      `${COLLECTIONS.PERSONS}/p1`,
      `${COLLECTIONS.VOLUNTEER_ROLES}/role-lyd`,
      `${COLLECTIONS.GROUPS}/lovsang`,
    ]) {
      expect(doomed).not.toContain(kept);
    }
  });

  test("tømmes planleggeren, står nettsiden; tømmes begge, går alt, og ingenting nevnes to ganger", () => {
    const planner = documentsToDelete(collections, ["planner"]).map((d) => `${d.collection}/${d.id}`);
    expect(planner).not.toContain(`${CMS_COLLECTIONS.PAGES}/page-forside`);
    expect(planner).not.toContain(`${COLLECTIONS.GATHERINGS}/gudstjeneste`);
    expect(planner).not.toContain(`${COLLECTIONS.GROUPS}/kalender`);
    expect(planner).toContain(`${COLLECTIONS.TASKS}/t-gudstjeneste`);

    const everything = documentsToDelete(collections, ["website", "planner"]).map((d) => `${d.collection}/${d.id}`);
    const total = Object.values(collections).reduce((sum, documents) => sum + documents.length, 0);
    expect(everything).toHaveLength(total);
    expect(new Set(everything).size).toBe(total);
  });
});
