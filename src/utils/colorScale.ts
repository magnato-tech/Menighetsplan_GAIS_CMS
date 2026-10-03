// Colour math for the website theme. An administrator picks one colour; the site needs
// eleven shades of it. The shades are built in OKLCH, where a given lightness looks equally
// light whatever the hue, so text stays readable on any colour that is picked.

export const SCALE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type ScaleStep = (typeof SCALE_STEPS)[number];
export type ColorScale = Record<ScaleStep, string>;

/** How light and how saturated each of the eleven steps is. */
export interface ShadeLadder {
  lightness: readonly number[];
  chroma: readonly number[];
}

// Tailwind's indigo: dark enough from 600 down for white text
export const PRIMARY_LADDER: ShadeLadder = {
  lightness: [0.962, 0.93, 0.87, 0.785, 0.673, 0.585, 0.511, 0.457, 0.398, 0.359, 0.257],
  chroma: [0.018, 0.034, 0.065, 0.115, 0.182, 0.233, 0.262, 0.24, 0.195, 0.144, 0.09],
};

// Tailwind's amber: light enough down to 400 for dark text
export const ACCENT_LADDER: ShadeLadder = {
  lightness: [0.987, 0.962, 0.924, 0.879, 0.828, 0.769, 0.666, 0.555, 0.473, 0.414, 0.279],
  chroma: [0.022, 0.059, 0.12, 0.169, 0.189, 0.188, 0.179, 0.163, 0.137, 0.112, 0.077],
};

interface Oklch {
  l: number;
  c: number;
  /** Degrees */
  h: number;
}

type Rgb = [number, number, number];

/** The colour as red, green and blue from 0 to 1, or null when the text is not a hex colour. */
export function parseHex(value: string): Rgb | null {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!match) return null;
  const digits = match[1].length === 3 ? match[1].replace(/./g, "$&$&") : match[1];
  return [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16) / 255) as Rgb;
}

export const isHexColor = (value: string): boolean => parseHex(value) !== null;

const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function toHex(linear: Rgb): string {
  const channel = (c: number) =>
    Math.round(toGamma(Math.min(1, Math.max(0, c))) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${linear.map(channel).join("")}`;
}

// The matrices are Björn Ottosson's reference for OKLab
function linearToOklch([r, g, b]: Rgb): Oklch {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bAxis = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const hue = (Math.atan2(bAxis, a) * 180) / Math.PI;
  return { l: lightness, c: Math.hypot(a, bAxis), h: hue < 0 ? hue + 360 : hue };
}

function oklchToLinear({ l: lightness, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);

  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const TOLERANCE = 0.0005;
const displayable = (rgb: Rgb) => rgb.every((c) => c >= -TOLERANCE && c <= 1 + TOLERANCE);

/** The colour a screen can show: same lightness and hue, with as much of the saturation as fits. */
function fitToScreen(color: Oklch): Rgb {
  const asGiven = oklchToLinear(color);
  if (displayable(asGiven)) return asGiven;

  let fits = 0;
  let tooMuch = color.c;
  for (let i = 0; i < 24; i++) {
    const tried = (fits + tooMuch) / 2;
    if (displayable(oklchToLinear({ ...color, c: tried }))) fits = tried;
    else tooMuch = tried;
  }
  return oklchToLinear({ ...color, c: fits });
}

/** The colour as lightness (0–1), chroma and hue (degrees), or null when it is not a hex colour. */
export function hexToOklch(hex: string): Oklch | null {
  const rgb = parseHex(hex);
  return rgb ? linearToOklch(rgb.map(toLinear) as Rgb) : null;
}

/** The hex colour closest to the given lightness, chroma and hue that a screen can show. */
export function oklchToHex(color: Oklch): string {
  return toHex(fitToScreen(color));
}

// A picked colour may be somewhat more saturated than the ladder at its step, but not without limit
const MAX_SATURATION = 1.25;

// Warm colours change hue with lightness, the way gold does: a lighter shade leans towards
// yellow and a darker one towards brown. Without it, a light gold comes out as peach.
const YELLOW_HUE = 98;
const BROWN_HUE = 46;
const WARM_FROM = 15;
const WARM_TO = 130;

/** How warm the hue is: 1 between brown and yellow, falling to 0 at red and at green. */
function warmth(hue: number): number {
  if (hue <= WARM_FROM || hue >= WARM_TO) return 0;
  if (hue < BROWN_HUE) return (hue - WARM_FROM) / (BROWN_HUE - WARM_FROM);
  if (hue > YELLOW_HUE) return (WARM_TO - hue) / (WARM_TO - YELLOW_HUE);
  return 1;
}

/** The hue a shade of the picked colour has at the given lightness. Only warm colours move. */
function hueAt(picked: Oklch, lightness: number, ladder: ShadeLadder): number {
  const strength = warmth(picked.h);
  if (strength === 0) return picked.h;

  const lightest = ladder.lightness[0];
  const darkest = ladder.lightness[ladder.lightness.length - 1];
  if (lightness > picked.l && picked.h < YELLOW_HUE) {
    const distance = Math.min(1, (lightness - picked.l) / (lightest - picked.l));
    return picked.h + (YELLOW_HUE - picked.h) * distance * strength;
  }
  if (lightness < picked.l && picked.h > BROWN_HUE) {
    const distance = Math.min(1, (picked.l - lightness) / (picked.l - darkest));
    return picked.h + (BROWN_HUE - picked.h) * distance * strength;
  }
  return picked.h;
}

/**
 * Eleven shades of the picked colour. The picked colour itself sits on the step closest to
 * it in lightness; the other steps take their lightness from the ladder, keep the hue (warm
 * colours drift, see above), and are as saturated relative to the ladder as the picked colour is.
 * Null when `hex` is not a colour.
 */
export function buildColorScale(hex: string, ladder: ShadeLadder): ColorScale | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const linear = rgb.map(toLinear) as Rgb;
  const picked = linearToOklch(linear);

  let anchor = 0;
  ladder.lightness.forEach((lightness, i) => {
    if (Math.abs(lightness - picked.l) < Math.abs(ladder.lightness[anchor] - picked.l)) anchor = i;
  });
  const saturation = Math.min(MAX_SATURATION, picked.c / ladder.chroma[anchor]);

  const scale = {} as ColorScale;
  SCALE_STEPS.forEach((step, i) => {
    scale[step] =
      i === anchor
        ? toHex(linear)
        : oklchToHex({
            l: ladder.lightness[i],
            c: ladder.chroma[i] * saturation,
            h: hueAt(picked, ladder.lightness[i], ladder),
          });
  });
  return scale;
}

function luminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast between two colours, from 1 (the same) to 21 (black on white). */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = luminance(hexA);
  const b = luminance(hexB);
  if (a === null || b === null) return 1;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
