// How the analysis board writes its numbers. A missing number is a dash, never a zero.

export const MISSING = "–";

/** "80 %" for 0.8. */
export function formatPercent(rate: number | null): string {
  return rate === null ? MISSING : `${Math.round(rate * 100)} %`;
}

export function formatCount(value: number | null): string {
  return value === null ? MISSING : value.toLocaleString("nb-NO");
}

/** A response time: "under 1 time", "5 timer", or "3 døgn" from two days and up. */
export function formatHours(hours: number | null): string {
  if (hours === null) return MISSING;
  if (hours < 1) return "under 1 time";
  if (hours < 48) {
    const whole = Math.round(hours);
    return whole === 1 ? "1 time" : `${whole} timer`;
  }
  return `${Math.round(hours / 24)} døgn`;
}

export interface Change {
  direction: "up" | "down" | "flat";
  /** "+15", "−3", "+5 prosentpoeng" */
  text: string;
}

/**
 * How a number moved since the period before. Null when either side is missing, so the
 * board never claims a rise from nothing. Rates are compared in percentage points.
 */
export function describeChange(
  current: number | null,
  previous: number | null,
  kind: "count" | "rate" = "count"
): Change | null {
  if (current === null || previous === null) return null;
  const diff = kind === "rate" ? Math.round((current - previous) * 100) : Math.round(current - previous);
  const unit = kind === "rate" ? " prosentpoeng" : "";
  if (diff === 0) return { direction: "flat", text: "Uendret" };
  return { direction: diff > 0 ? "up" : "down", text: `${diff > 0 ? "+" : "−"}${Math.abs(diff)}${unit}` };
}

/** "13.9." for a column label. */
export function formatDayMonth(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

/** "i dag", "i går", "for 12 dager siden". Null gives "aldri". */
export function formatDaysAgo(iso: string | null, now: number): string {
  if (!iso) return "aldri";
  const start = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const days = Math.round((start(now) - start(new Date(iso).getTime())) / (24 * 60 * 60 * 1000));
  if (Number.isNaN(days)) return "aldri";
  if (days <= 0) return "i dag";
  if (days === 1) return "i går";
  return `for ${days} dager siden`;
}

/**
 * Clean axis ticks from zero up past the largest value: 0, 25, 50, 75, 100.
 * At most six ticks, on steps of 1, 2, 2.5 or 5 times a power of ten. What the charts count
 * comes in whole numbers (people, visits), so a step is always a whole number too: an axis
 * never shows half a visit.
 */
export function chartTicks(max: number): number[] {
  if (!(max > 0)) return [0];
  const rough = max / 4;
  const power = Math.max(1, Math.pow(10, Math.floor(Math.log10(rough))));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * power).filter(Number.isInteger).find((s) => max / s <= 5) ?? 10 * power;
  const ticks: number[] = [];
  for (let value = 0; value < max + step; value += step) {
    ticks.push(Math.round(value * 100) / 100);
    if (value >= max) break;
  }
  return ticks;
}
