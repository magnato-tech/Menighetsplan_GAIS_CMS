import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe } from "vitest";
import { assert } from "./assert";

const ROOT = join(__dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

const read = (path: string) => readFileSync(path, "utf8");
const lines = (path: string) => read(path).split("\n").length - (read(path).endsWith("\n") ? 1 : 0);
const rel = (path: string) => relative(ROOT, path).split("\\").join("/");

/** Code that runs in the app or on the server. Tests and demo data are held to other rules. */
const appFiles = [...sourceFiles(join(ROOT, "src")), ...sourceFiles(join(ROOT, "server")), join(ROOT, "server.ts")].filter(
  (p) => !rel(p).startsWith("src/tests/")
);

describe("Filstørrelse: en fil som får mer enn 400 linjer bør deles", () => {
  const LIMIT = 400;
  /**
   * Files that were already over the limit when it was introduced, each with the most lines it may have.
   * The cap only goes down: split a file, then remove it from here or lower its number.
   */
  const KNOWN_LARGE: Record<string, number> = {
    "src/components/GroupChat.tsx": 634,
    "src/pages/admin/tabs/pages/PageTreeList.tsx": 605,
    "src/pages/leaderGroup/GroupActivities.tsx": 591,
    "src/components/GatheringDetailView.tsx": 584,
    "src/context/FirebaseDataContext.tsx": 520,
    "src/pages/LeaderPage.tsx": 513,
    "src/pages/admin/tabs/ThemeTab.tsx": 501,
    "src/pages/public/PublicHomePage.tsx": 497,
    "src/pages/admin/tabs/TasksTab.tsx": 494,
    "src/pages/admin/tabs/pages/PagePreviewModal.tsx": 470,
    "src/pages/admin/tabs/StaffTab.tsx": 467,
    "src/components/cms/CmsContentRenderer.tsx": 440,
    "src/pages/AdminTaskDetailPage.tsx": 436,
    "src/components/husfellesskap/MeetingTab.tsx": 435,
    "src/hooks/leaderHooks.ts": 425,
    "src/pages/admin/StudioSidebar.tsx": 409,
  };
  // Demo and test data is long by nature
  const checked = appFiles.filter((p) => !rel(p).startsWith("src/data/"));

  const tooLong = checked.filter((p) => lines(p) > LIMIT && !(rel(p) in KNOWN_LARGE)).map(rel);
  assert(tooLong.length === 0, `Ingen ny fil er over ${LIMIT} linjer (deles: ${tooLong.join(", ") || "ingen"})`);

  const grown = checked.filter((p) => rel(p) in KNOWN_LARGE && lines(p) > KNOWN_LARGE[rel(p)]).map(rel);
  assert(grown.length === 0, `Ingen av de store filene har vokst (har vokst: ${grown.join(", ") || "ingen"})`);

  const shrunk = Object.keys(KNOWN_LARGE).filter((f) => {
    const path = join(ROOT, f);
    return !checked.includes(path) || lines(path) <= LIMIT;
  });
  assert(shrunk.length === 0, `Filer under grensen er fjernet fra listen (fjern: ${shrunk.join(", ") || "ingen"})`);
});

describe("Regler fra CLAUDE.md som kan sjekkes i kildekoden", () => {
  const offenders = (pattern: RegExp, files = appFiles) =>
    files.filter((p) => pattern.test(read(p))).map(rel);

  const emptyCatch = offenders(/catch\s*(\([^)]*\))?\s*\{\s*\}/);
  assert(emptyCatch.length === 0, `Ingen tom catch (${emptyCatch.join(", ") || "ingen"})`);

  const titleSetters = offenders(/document\.title\s*=/, appFiles.filter((p) => !["src/App.tsx", "src/utils/seoUtils.ts"].includes(rel(p))));
  assert(titleSetters.length === 0, `Tittelen settes bare i App.tsx og seoUtils.ts (${titleSetters.join(", ") || "ingen"})`);

  const selfClearing = offenders(
    /setTimeout\(\s*\(\)\s*=>\s*set\w+\(\s*(null|false|"")\s*\)/,
    appFiles.filter((p) => rel(p) !== "src/hooks/useTimedMessage.ts")
  );
  assert(selfClearing.length === 0, `Meldinger som forsvinner bruker useTimedMessage (${selfClearing.join(", ") || "ingen"})`);

  // A type import is fine; what must not happen is that a rule needs React to run
  const utilsWithReact = offenders(/^import\s+(?!type\b)[^;]*from\s+["']react["']/m, appFiles.filter((p) => rel(p).startsWith("src/utils/")));
  assert(utilsWithReact.length === 0, `src/utils er rene funksjoner uten React (${utilsWithReact.join(", ") || "ingen"})`);

  const developerLabels = offenders(
    />\s*[^<>{}\n]*\b(Firestore|JSON API|API-endepunkt|isPublic|leaderIds)\b[^<>{}\n]*</,
    appFiles.filter((p) => /^src\/(pages|components)\//.test(rel(p)))
  );
  assert(developerLabels.length === 0, `Ingen utviklerord i skjermtekst (${developerLabels.join(", ") || "ingen"})`);
});
