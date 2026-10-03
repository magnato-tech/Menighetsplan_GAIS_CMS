import { describe, expect, test } from "vitest";
import { join } from "node:path";
import golden from "./golden/api-surface.golden.json";
import { readSurface } from "./support/apiSurface";

/**
 * Sikrer at ingen funksjon, komponent eller rute er forsvunnet uten at noen har bestemt det. Fasiten er alt
 * koden tilbød før oppryddingen: hvert eksportert navn i hver fil, alt konteksten useFirebase og useCms
 * deler ut, og alle rutene. Nye ting er fritt fram. Fjernes noe, må det stå her med en grunn.
 */

const REMOVED_FILES: Record<string, string> = {
  "src/components/admin/DatabaseTestdataTab.tsx": "Den minste av to testdatageneratorer. Databasefanen har den ene som er igjen.",
  "src/pages/AdminSettingsPage.tsx": "Ingen brukte den. /admin/settings sender videre til databasefanen.",
  "src/pages/admin/AdminCmsPanel.tsx": "Fil på én linje som bare videresendte. Bruk components/admin/AdminCmsPanel.",
};

const REMOVED_NAMES: Record<string, Record<string, string>> = {
  "src/components/cms/CmsContentRenderer.tsx": {
    parseCmsContent: "Flyttet til src/utils/cmsContent.ts",
    ParsedBlock: "Flyttet til src/utils/cmsContent.ts",
  },
  "src/data/cmsData.ts": {
    CmsStaffMember: "cms_staff brukes ikke lenger. Stab kommer fra personregisteret.",
    initialCmsStaff: "cms_staff brukes ikke lenger. Stab kommer fra personregisteret.",
  },
  "src/services/databaseAdmin.ts": {
    generate32TestPersons: "Hurtiggeneratoren er borte. Pakken Fullskala gjør det samme.",
    deletePersonsTestdata: "Delsletting fantes bare i hurtiggeneratoren.",
    deleteGroupsTestdata: "Delsletting fantes bare i hurtiggeneratoren.",
    deleteRolesTestdata: "Delsletting fantes bare i hurtiggeneratoren.",
  },
  "src/services/testdataService.ts": {
    generate32TestPersons: "Hurtiggeneratoren er borte. Pakken Fullskala gjør det samme.",
    deletePersonsTestdata: "Delsletting fantes bare i hurtiggeneratoren.",
    deleteGroupsTestdata: "Delsletting fantes bare i hurtiggeneratoren.",
    deleteRolesTestdata: "Delsletting fantes bare i hurtiggeneratoren.",
  },
};

const REMOVED_CONTEXT: Record<string, Record<string, string>> = {
  useCms: {
    staff: "cms_staff brukes ikke lenger",
    saveStaff: "cms_staff brukes ikke lenger",
    deleteStaff: "cms_staff brukes ikke lenger",
  },
};

const now = readSurface(join(__dirname, ".."));

describe("Ingenting viktig er borte", () => {
  test("hver fil fra før finnes, bortsett fra de som er fjernet med vilje", () => {
    const gone = Object.keys(golden.exports).filter((f) => !(f in now.exports) && !(f in REMOVED_FILES));
    expect(gone).toEqual([]);
  });

  test("hvert eksportert navn fra før finnes, bortsett fra de som er fjernet eller flyttet med vilje", () => {
    const gone: string[] = [];
    for (const [file, names] of Object.entries(golden.exports) as [string, string[]][]) {
      if (!(file in now.exports)) continue;
      for (const name of names) {
        if (!now.exports[file].includes(name) && !(name in (REMOVED_NAMES[file] ?? {}))) gone.push(`${file} :: ${name}`);
      }
    }
    expect(gone).toEqual([]);
  });

  test("useFirebase og useCms deler ut det de gjorde før", () => {
    const gone: string[] = [];
    for (const [context, members] of Object.entries(golden.contexts) as [string, string[]][]) {
      for (const m of members) {
        if (!now.contexts[context].includes(m) && !(m in (REMOVED_CONTEXT[context] ?? {}))) gone.push(`${context}.${m}`);
      }
    }
    expect(gone).toEqual([]);
  });

  test("alle rutene fra før finnes", () => {
    expect(golden.routes.filter((r) => !now.routes.includes(r))).toEqual([]);
  });

  test("det som står som fjernet er virkelig borte, så listen ikke blir stående med gamle unntak", () => {
    const stale: string[] = [];
    for (const f of Object.keys(REMOVED_FILES)) if (f in now.exports) stale.push(f);
    for (const [file, names] of Object.entries(REMOVED_NAMES)) for (const n of Object.keys(names)) if (now.exports[file]?.includes(n)) stale.push(`${file} :: ${n}`);
    for (const [context, members] of Object.entries(REMOVED_CONTEXT)) for (const m of Object.keys(members)) if (now.contexts[context].includes(m)) stale.push(`${context}.${m}`);
    expect(stale).toEqual([]);
  });

  test("de viktigste handlingene finnes fortsatt, med navn", () => {
    const planning = [
      "createGathering", "updateGathering", "deleteGathering", "createTask", "deleteTask", "createGroup", "updateGroup", "addGroupMember",
      "removeGroupMember", "addPerson", "updatePerson", "assignTaskToPerson", "respondToGathering", "sendGroupMessage",
    ];
    const cms = ["saveSettings", "savePage", "deletePage", "reorderPages", "saveNews", "deleteNews", "saveSermon", "deleteSermon"];
    expect(planning.filter((a) => !now.contexts.useFirebase.includes(a))).toEqual([]);
    expect(cms.filter((a) => !now.contexts.useCms.includes(a))).toEqual([]);
  });
});
