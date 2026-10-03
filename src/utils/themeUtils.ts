import type React from "react";
import { CmsDesignTheme, defaultCmsDesignTheme } from "../data/cmsData";
import { ACCENT_LADDER, PRIMARY_LADDER, SCALE_STEPS, ShadeLadder, buildColorScale } from "./colorScale";

/** CSS custom properties, to be set as the inline style of the element the theme applies within. */
export type ThemeCssVariables = React.CSSProperties & Record<`--${string}`, string>;

/** The class that goes with the variables. It applies the theme's fonts (see src/index.css). */
export const SITE_THEME_CLASS = "site-theme";

const PAGE_BACKGROUNDS: Record<CmsDesignTheme["backgroundTone"], string> = {
  stone: "#fafaf9",
  slate: "#f8fafc",
  warm: "#fdfbf7",
  "pure-white": "#ffffff",
};

const SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif";

// "display" has no typeface of its own yet, so it reads as sans
const HEADING_FONTS: Record<CmsDesignTheme["headingFont"], string> = { sans: SANS, serif: SERIF, display: SANS };
const BODY_FONTS: Record<CmsDesignTheme["bodyFont"], string> = { sans: SANS, serif: SERIF };

// Tailwind's own radii are the middle choice. A card (rounded-2xl) is 6, 16 or 24 px.
const RADII: Record<CmsDesignTheme["borderRadius"], Record<"lg" | "xl" | "2xl" | "3xl", string>> = {
  sharp: { lg: "0.25rem", xl: "0.375rem", "2xl": "0.375rem", "3xl": "0.5rem" },
  medium: { lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", "3xl": "1.5rem" },
  smooth: { lg: "0.75rem", xl: "1rem", "2xl": "1.5rem", "3xl": "2rem" },
};

/** The eleven shades of one theme colour, as the variables Tailwind's `bg-primary-700` and the like read. */
function shadeVariables(name: "primary" | "accent", picked: string, fallback: string, ladder: ShadeLadder) {
  // What is stored may be half-typed or missing; then the default colour stands in
  const scale = buildColorScale(picked, ladder) ?? buildColorScale(fallback, ladder)!;
  return Object.fromEntries(SCALE_STEPS.map((step) => [`--color-${name}-${step}`, scale[step]]));
}

/**
 * Everything the chosen theme decides, as CSS variables: the shades of the primary and the
 * accent colour, the page background, the fonts and the corner radii. Set them on an element
 * together with SITE_THEME_CLASS, and everything inside follows the theme.
 */
export function getThemeCssVariables(theme?: Partial<CmsDesignTheme>): ThemeCssVariables {
  const chosen = { ...defaultCmsDesignTheme, ...theme };
  const radii = RADII[chosen.borderRadius] ?? RADII.medium;

  return {
    ...shadeVariables("primary", chosen.primaryColor, defaultCmsDesignTheme.primaryColor, PRIMARY_LADDER),
    ...shadeVariables("accent", chosen.accentColor, defaultCmsDesignTheme.accentColor, ACCENT_LADDER),
    "--color-page": PAGE_BACKGROUNDS[chosen.backgroundTone] ?? PAGE_BACKGROUNDS.stone,
    "--site-font-heading": HEADING_FONTS[chosen.headingFont] ?? SANS,
    "--site-font-body": BODY_FONTS[chosen.bodyFont] ?? SANS,
    "--radius-lg": radii.lg,
    "--radius-xl": radii.xl,
    "--radius-2xl": radii["2xl"],
    "--radius-3xl": radii["3xl"],
  };
}
