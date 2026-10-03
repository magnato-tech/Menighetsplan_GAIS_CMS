import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { THEME_PRESETS, defaultCmsDesignTheme } from "../src/data/cmsData";
import { SCALE_STEPS, contrastRatio, isHexColor } from "../src/utils/colorScale";
import { ThemeCssVariables, getThemeCssVariables } from "../src/utils/themeUtils";

const shadesOf = (variables: ThemeCssVariables, name: "primary" | "accent") =>
  SCALE_STEPS.map((step) => variables[`--color-${name}-${step}`]);

describe("Designet som velges i admin, slik nettsiden får det", () => {
  test("Hvert ferdige tema gir nettsiden alle fargene, bakgrunn, skrift og avrunding", () => {
    for (const preset of THEME_PRESETS) {
      const variables = getThemeCssVariables(preset.theme);
      expect(shadesOf(variables, "primary").every(isHexColor), preset.name).toBe(true);
      expect(shadesOf(variables, "accent").every(isHexColor), preset.name).toBe(true);
      expect(isHexColor(variables["--color-page"]), preset.name).toBe(true);
      for (const name of ["--site-font-heading", "--site-font-body", "--radius-xl", "--radius-2xl", "--radius-3xl"]) {
        expect(variables[name as "--radius-xl"], `${preset.name}: ${name}`).toBeTruthy();
      }
    }
  });

  test("Fargene som velges, er med i det nettsiden får", () => {
    for (const { theme, name } of THEME_PRESETS) {
      const variables = getThemeCssVariables(theme);
      expect(shadesOf(variables, "primary"), name).toContain(theme.primaryColor);
      expect(shadesOf(variables, "accent"), name).toContain(theme.accentColor);
    }
  });

  test("En ny primærfarge endrer nettsidens farger, og bare primærfargen", () => {
    const before = getThemeCssVariables(defaultCmsDesignTheme);
    const after = getThemeCssVariables({ ...defaultCmsDesignTheme, primaryColor: "#166534" });
    expect(shadesOf(after, "primary")).not.toEqual(shadesOf(before, "primary"));
    expect(shadesOf(after, "accent")).toEqual(shadesOf(before, "accent"));
  });

  test("Uten lagret tema gjelder standardtemaet", () => {
    expect(getThemeCssVariables(undefined)).toEqual(getThemeCssVariables(defaultCmsDesignTheme));
    expect(getThemeCssVariables({})).toEqual(getThemeCssVariables(defaultCmsDesignTheme));
  });

  test("En farge som er halvveis skrevet inn, lar standardfargen stå", () => {
    const halfTyped = getThemeCssVariables({ ...defaultCmsDesignTheme, primaryColor: "#1e3a8", accentColor: "" });
    expect(halfTyped).toEqual(getThemeCssVariables(defaultCmsDesignTheme));
  });

  test("Knapper og lenker er lesbare i alle de ferdige temaene", () => {
    for (const { theme, name } of THEME_PRESETS) {
      const v = getThemeCssVariables(theme);
      expect(contrastRatio("#ffffff", v["--color-primary-700"]), `${name}: hvit på primærknapp`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(v["--color-primary-700"], v["--color-page"]), `${name}: lenke på siden`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio("#0c0a09", v["--color-accent-400"]), `${name}: mørk tekst på aksentknapp`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(v["--color-accent-300"], v["--color-primary-900"]), `${name}: aksent på mørk flate`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("Avrundingen på et kort er 6, 16 eller 24 piksler", () => {
    const cardRadius = (borderRadius: "sharp" | "medium" | "smooth") =>
      getThemeCssVariables({ ...defaultCmsDesignTheme, borderRadius })["--radius-2xl"];
    expect(cardRadius("sharp")).toBe("0.375rem");
    expect(cardRadius("medium")).toBe("1rem");
    expect(cardRadius("smooth")).toBe("1.5rem");
  });

  test("Skrift og bakgrunn følger valget", () => {
    const serif = getThemeCssVariables({ ...defaultCmsDesignTheme, headingFont: "serif", bodyFont: "sans" });
    expect(serif["--site-font-heading"]).toContain("serif");
    expect(serif["--site-font-heading"]).not.toContain("sans-serif");
    expect(serif["--site-font-body"]).toContain("sans-serif");

    const white = getThemeCssVariables({ ...defaultCmsDesignTheme, backgroundTone: "pure-white" });
    expect(white["--color-page"]).toBe("#ffffff");
  });
});

// A public page that uses a fixed palette for its main colours ignores the design chosen in admin
describe("Nettsiden bruker temafargene", () => {
  const publicFolders = ["../src/pages/public/", "../src/components/public/", "../src/components/cms/"];
  const publicFiles = publicFolders.flatMap((folder) =>
    readdirSync(new URL(folder, import.meta.url))
      .filter((name) => name.endsWith(".tsx"))
      .map((name) => ({ name, source: readFileSync(new URL(folder + name, import.meta.url), "utf8") }))
  );

  test("De offentlige sidene finnes der testen leter", () => {
    expect(publicFiles.length).toBeGreaterThanOrEqual(10);
  });

  test("Ingen offentlig side har indigo som fast farge", () => {
    for (const { name, source } of publicFiles) {
      expect(source.match(/[a-z]-indigo-\d+/g) ?? [], `${name} skal bruke primary-* i stedet`).toEqual([]);
    }
  });

  test("Amber brukes bare til varselboksen i innholdet", () => {
    for (const { name, source } of publicFiles) {
      if (name === "CmsContentRenderer.tsx") continue;
      expect(source.match(/[a-z]-amber-\d+/g) ?? [], `${name} skal bruke accent-* i stedet`).toEqual([]);
    }
  });
});
