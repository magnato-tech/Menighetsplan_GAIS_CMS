/** Semantic Tailwind classes backed by CSS variables on [data-studio-theme]. */

export const studioThemeAttr = (theme: "dark" | "light") =>
  ({ "data-studio-theme": theme }) as const;

export const studioBg = "bg-[var(--studio-bg)] text-[var(--studio-text)]";
export const studioPanelBg = "bg-[var(--studio-panel-bg)]";
export const studioSurface = "bg-[var(--studio-surface)] border border-[var(--studio-border)]";
export const studioCard =
  "rounded-2xl bg-[var(--studio-surface)] border border-[var(--studio-border)] shadow-xs";
export const studioCardPadded = studioCard + " p-4 sm:p-5";
export const studioMuted = "text-[var(--studio-muted)]";
export const studioText = "text-[var(--studio-text)]";
export const studioBorder = "border-[var(--studio-border)]";
export const studioBorderB = "border-b border-[var(--studio-border)]";
export const studioBorderT = "border-t border-[var(--studio-border)]";
export const studioHover = "hover:bg-[var(--studio-hover)]";
export const studioHoverText = "hover:text-[var(--studio-text)]";
export const studioInput =
  "bg-[var(--studio-input)] border border-[var(--studio-border)] text-[var(--studio-input-text)] placeholder:text-[var(--studio-muted)] focus:outline-none focus:border-indigo-500";
export const studioInputFull = "w-full px-3 py-2 text-xs rounded-xl " + studioInput;
export const studioRow =
  "p-2.5 rounded-xl bg-[var(--studio-row)] border border-[var(--studio-border)] flex items-center justify-between text-xs";
export const studioNavInactive =
  "text-[var(--studio-muted)] hover:text-[var(--studio-text)] hover:bg-[var(--studio-hover)]";
export const studioNavActive = "bg-indigo-600 text-white shadow-sm";
export const studioBadge = "text-[10px] px-1.5 py-0.5 rounded bg-[var(--studio-row)] text-[var(--studio-muted)]";
export const studioOverlay = "fixed inset-0 z-50 bg-[var(--studio-overlay)] backdrop-blur-xs";
export const studioLink = "font-bold text-indigo-500 hover:text-indigo-600 transition-colors";
export const studioLinkDark = "font-bold text-indigo-400 hover:text-indigo-300 transition-colors";
export const studioPrimaryButton =
  "bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors cursor-pointer";
export const studioSecondaryButton =
  "px-3 py-1.5 rounded-lg bg-[var(--studio-row)] hover:bg-[var(--studio-hover)] text-[var(--studio-text)] text-xs font-semibold border border-[var(--studio-border)] cursor-pointer";
