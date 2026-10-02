import React from "react";
import { CmsDesignTheme, defaultCmsDesignTheme, THEME_PRESETS, ThemePreset } from "../data/cmsData";

export interface ThemeCssVariables extends React.CSSProperties {
  "--cms-primary"?: string;
  "--cms-accent"?: string;
  "--cms-radius"?: string;
  "--cms-radius-sm"?: string;
  "--cms-bg"?: string;
  "--cms-font-heading"?: string;
  "--cms-font-body"?: string;
}

export function getThemeCssVariables(theme?: CmsDesignTheme): ThemeCssVariables {
  const t = theme || defaultCmsDesignTheme;

  const radiusMap = {
    sharp: { base: "6px", sm: "4px" },
    medium: { base: "16px", sm: "8px" },
    smooth: { base: "24px", sm: "12px" },
  };

  const bgMap = {
    stone: "#fafaf9",      // Tailwind stone-50
    slate: "#f8fafc",      // Tailwind slate-50
    warm: "#fdfbf7",       // Warm organic sand
    "pure-white": "#ffffff",
  };

  const fontHeadingMap = {
    sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
    display: "ui-sans-serif, system-ui, sans-serif",
  };

  const fontBodyMap = {
    sans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
  };

  const radiusValues = radiusMap[t.borderRadius] || radiusMap.medium;

  return {
    "--cms-primary": t.primaryColor || "#1e3a8a",
    "--cms-accent": t.accentColor || "#d97706",
    "--cms-radius": radiusValues.base,
    "--cms-radius-sm": radiusValues.sm,
    "--cms-bg": bgMap[t.backgroundTone] || bgMap.stone,
    "--cms-font-heading": fontHeadingMap[t.headingFont] || fontHeadingMap.sans,
    "--cms-font-body": fontBodyMap[t.bodyFont] || fontBodyMap.sans,
  };
}

export function getThemeBackgroundClass(theme?: CmsDesignTheme): string {
  const tone = theme?.backgroundTone || "stone";
  switch (tone) {
    case "slate":
      return "bg-slate-50";
    case "warm":
      return "bg-stone-50/80";
    case "pure-white":
      return "bg-white";
    case "stone":
    default:
      return "bg-stone-50";
  }
}

export function getThemeHeadingFontFamily(theme?: CmsDesignTheme): string {
  return theme?.headingFont === "serif" ? "serif" : "sans-serif";
}

export function getThemeRadiusClass(theme?: CmsDesignTheme): string {
  const radius = theme?.borderRadius || "medium";
  switch (radius) {
    case "sharp":
      return "rounded-lg";
    case "smooth":
      return "rounded-3xl";
    case "medium":
    default:
      return "rounded-2xl";
  }
}

export function findThemePreset(presetId?: string): ThemePreset | undefined {
  if (!presetId) return undefined;
  return THEME_PRESETS.find((p) => p.id === presetId);
}
