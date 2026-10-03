import { describe, expect, test } from "vitest";
import {
  ACCENT_LADDER,
  PRIMARY_LADDER,
  SCALE_STEPS,
  buildColorScale,
  contrastRatio,
  hexToOklch,
  isHexColor,
  oklchToHex,
} from "../src/utils/colorScale";

const WHITE = "#ffffff";
const DARK_TEXT = "#0c0a09"; // stone-950, the dark text the site puts on accent buttons
const DARK_SURFACE = "#1c1917"; // stone-900, the footer and the hero

// The colours offered in the design tab, and a strongly saturated colour for every 30 degrees of hue
const OFFERED = ["#1e3a8a", "#1d4ed8", "#166534", "#047857", "#c2410c", "#881337", "#581c87", "#334155", "#4f46e5"];
const OFFERED_ACCENTS = ["#d97706", "#0284c7", "#0d9488", "#ca8a04", "#06b6d4", "#e11d48", "#65a30d"];
const AROUND_THE_WHEEL = Array.from({ length: 12 }, (_, i) => oklchToHex({ l: 0.6, c: 0.3, h: i * 30 }));
const EXTREMES = ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffff00"];

const lightnessOf = (hex: string) => hexToOklch(hex)!.l;

describe("Fargeregning", () => {
  test("Bare en hex-farge regnes som en farge", () => {
    for (const color of ["#1e3a8a", "1E3A8A", "#fff", " #d97706 "]) expect(isHexColor(color)).toBe(true);
    for (const text of ["", "#1e3a8", "blue", "#12345g", "rgb(0,0,0)"]) expect(isHexColor(text)).toBe(false);
  });

  test("Regnestykket stemmer med Tailwinds egen tabell", () => {
    // indigo-600 er oklch(51.1% … 276.966), amber-600 er oklch(66.6% … 58.318)
    const indigo = hexToOklch("#4f46e5")!;
    expect(indigo.l).toBeCloseTo(0.511, 2);
    expect(indigo.h).toBeCloseTo(277, 0);

    const amber = hexToOklch("#d97706")!;
    expect(amber.l).toBeCloseTo(0.666, 2);
    expect(amber.h).toBeCloseTo(58.3, 0);
  });

  test("En farge tåler turen fram og tilbake", () => {
    for (const color of [...OFFERED, ...OFFERED_ACCENTS, ...EXTREMES]) {
      expect(oklchToHex(hexToOklch(color)!)).toBe(color);
    }
  });

  test("En farge skjermen ikke kan vise, blir til den nærmeste den kan vise", () => {
    const shown = hexToOklch(oklchToHex({ l: 0.511, c: 0.4, h: 277 }))!;
    expect(shown.l).toBeCloseTo(0.511, 2);
    expect(shown.h).toBeCloseTo(277, 0);
    expect(shown.c).toBeLessThan(0.4);
  });

  test("Kontrast går fra 1 til 21", () => {
    expect(contrastRatio("#000000", WHITE)).toBeCloseTo(21, 5);
    expect(contrastRatio("#4f46e5", "#4f46e5")).toBe(1);
  });
});

describe("Skalaen som bygges av én valgt farge", () => {
  test("Den har elleve trinn, fra lyst til mørkt", () => {
    for (const color of [...OFFERED, ...OFFERED_ACCENTS, ...AROUND_THE_WHEEL, ...EXTREMES]) {
      for (const ladder of [PRIMARY_LADDER, ACCENT_LADDER]) {
        const scale = buildColorScale(color, ladder)!;
        const shades = SCALE_STEPS.map((step) => scale[step]);
        expect(shades.every(isHexColor)).toBe(true);
        for (let i = 1; i < shades.length; i++) {
          expect(lightnessOf(shades[i])).toBeLessThan(lightnessOf(shades[i - 1]));
        }
      }
    }
  });

  test("Fargen som er valgt, står selv i skalaen", () => {
    expect(buildColorScale("#1E3A8A", PRIMARY_LADDER)![800]).toBe("#1e3a8a");
    expect(buildColorScale("#4f46e5", PRIMARY_LADDER)![600]).toBe("#4f46e5");
    expect(buildColorScale("#d97706", ACCENT_LADDER)![600]).toBe("#d97706");
    expect(buildColorScale("#fff", PRIMARY_LADDER)![50]).toBe("#ffffff");
  });

  test("Alle trinn har samme fargetone som den valgte fargen", () => {
    const picked = hexToOklch("#166534")!;
    const scale = buildColorScale("#166534", PRIMARY_LADDER)!;
    for (const step of [200, 400, 600, 800] as const) {
      expect(Math.abs(hexToOklch(scale[step])!.h - picked.h)).toBeLessThan(4);
    }
  });

  test("Gull går mot gult når det blir lysere, og mot brunt når det blir mørkere", () => {
    const scale = buildColorScale("#d97706", ACCENT_LADDER)!;
    const hue = (step: 100 | 400 | 600 | 900) => hexToOklch(scale[step])!.h;
    expect(hue(100)).toBeGreaterThan(hue(400));
    expect(hue(400)).toBeGreaterThan(hue(600));
    expect(hue(600)).toBeGreaterThan(hue(900));
    // Tailwinds amber-400 er #fbbf24: gyllen, ikke fersken
    expect(hue(400)).toBeGreaterThan(70);
    expect(hue(400)).toBeLessThan(95);
  });

  test("Farger som ikke er varme, endrer ikke fargetone", () => {
    for (const color of ["#1e3a8a", "#0284c7", "#0d9488", "#581c87", "#e11d48"]) {
      const picked = hexToOklch(color)!;
      const scale = buildColorScale(color, ACCENT_LADDER)!;
      for (const step of [300, 500, 800] as const) {
        expect(Math.abs(hexToOklch(scale[step])!.h - picked.h), `${color} trinn ${step}`).toBeLessThan(6);
      }
    }
  });

  test("En dempet farge gir en dempet skala", () => {
    const scale = buildColorScale("#334155", PRIMARY_LADDER)!;
    for (const step of SCALE_STEPS) expect(hexToOklch(scale[step])!.c).toBeLessThan(0.08);
  });

  test("Det som ikke er en farge, gir ingen skala", () => {
    expect(buildColorScale("#1e3a8", PRIMARY_LADDER)).toBeNull();
    expect(buildColorScale("blå", ACCENT_LADDER)).toBeNull();
  });
});

// The combinations below are the ones the public pages use (WCAG AA: 4.5 for text, 3 for large text and icons)
describe("Teksten er lesbar uansett hvilken farge som velges", () => {
  test("Hvit tekst på primærfargen fra trinn 600 og mørkere", () => {
    for (const color of [...OFFERED, ...AROUND_THE_WHEEL, ...EXTREMES]) {
      const scale = buildColorScale(color, PRIMARY_LADDER)!;
      for (const step of [600, 700, 800, 900, 950] as const) {
        expect(contrastRatio(WHITE, scale[step]), `hvit på ${color} trinn ${step}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test("Primærfargen som tekst og lenke på lys bakgrunn", () => {
    for (const color of [...OFFERED, ...AROUND_THE_WHEEL, ...EXTREMES]) {
      const scale = buildColorScale(color, PRIMARY_LADDER)!;
      expect(contrastRatio(scale[600], WHITE), `${color} trinn 600 på hvit`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(scale[700], scale[50]), `${color} trinn 700 på trinn 50`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(scale[800], scale[100]), `${color} trinn 800 på trinn 100`).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("Mørk tekst på aksentfargen til og med trinn 500", () => {
    for (const color of [...OFFERED_ACCENTS, ...AROUND_THE_WHEEL, ...EXTREMES]) {
      const scale = buildColorScale(color, ACCENT_LADDER)!;
      for (const step of [300, 400, 500] as const) {
        expect(contrastRatio(DARK_TEXT, scale[step]), `mørk tekst på ${color} trinn ${step}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test("Aksentfargen på mørk bakgrunn, og som mørk tekst på sin egen lyse tone", () => {
    for (const color of [...OFFERED_ACCENTS, ...AROUND_THE_WHEEL, ...EXTREMES]) {
      const scale = buildColorScale(color, ACCENT_LADDER)!;
      expect(contrastRatio(scale[300], DARK_SURFACE), `${color} trinn 300 på mørk flate`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(scale[400], DARK_SURFACE), `${color} trinn 400 på mørk flate`).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(scale[900], scale[100]), `${color} trinn 900 på trinn 100`).toBeGreaterThanOrEqual(4.5);
      // Icons and large, heavy text
      expect(contrastRatio(scale[700], WHITE), `${color} trinn 700 på hvit`).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(scale[700], scale[50]), `${color} trinn 700 på trinn 50`).toBeGreaterThanOrEqual(3);
    }
  });
});
