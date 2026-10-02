import { describe } from "vitest";
import { assert } from "./assert";
import { STUDIO_TABS, toStudioTab } from "../src/pages/admin/studio";

describe("Admin Studio", () => {
  // The tab comes from the address, which anyone can type
  assert(toStudioTab("cms-sider") === "cms-sider", "En kjent fane i adressen åpnes");
  assert(STUDIO_TABS.every((tab) => toStudioTab(tab) === tab), "Alle fanene kan åpnes fra adressen");
  assert(toStudioTab(null) === "dashboard", "Uten fane i adressen åpnes oversikten");
  assert(toStudioTab("") === "dashboard", "En tom fane i adressen åpner oversikten");
  assert(toStudioTab("pages") === "dashboard", "En ukjent fane i adressen åpner oversikten");
});
