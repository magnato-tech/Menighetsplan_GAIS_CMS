import type { Gathering, GatheringHeadcount } from "../types";
import { isGroupGathering } from "./gatherings";

// Oppmøtetall: how many were actually at a gathering, counted on the day.
// A response ("Kommer") is a plan; a headcount is what happened. The rules for both
// registering and reading one live here, so the dialog and the analysis agree.

/** One count per gathering. Registering again replaces it instead of adding a second. */
export function headcountIdFor(gatheringId: string): string {
  return `headcount-${gatheringId}`;
}

/** Everyone counted, adults and children together. */
export function headcountTotal(count: Pick<GatheringHeadcount, "adults" | "children">): number {
  return count.adults + count.children;
}

/** No single gathering in a congregation this size is counted in the tens of thousands. */
export const MAX_HEADCOUNT = 10000;

/**
 * Whether attendance can be counted for the gathering: it has started, it was not
 * cancelled, and it is not a group meeting (those are followed through "Kommer"/"Kommer ikke").
 */
export function canRegisterHeadcount(
  gathering: Pick<Gathering, "startsAt" | "cancelled" | "type">,
  now: number
): boolean {
  const start = new Date(gathering.startsAt).getTime();
  if (Number.isNaN(start) || start > now) return false;
  return !gathering.cancelled && !isGroupGathering(gathering);
}

export type HeadcountInput = { adults: number; children: number; note?: string };

export type ParsedHeadcount = { ok: true; value: HeadcountInput } | { ok: false; error: string };

function parseCount(text: string, label: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: true, value: 0 };
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: `${label} må være et helt tall (0 eller mer).` };
  const value = Number(trimmed);
  if (value > MAX_HEADCOUNT) return { ok: false, error: `${label} kan ikke være over ${MAX_HEADCOUNT}.` };
  return { ok: true, value };
}

/**
 * Reads the two fields of the headcount form. An empty field counts as 0, but a count
 * where nobody was there is refused: a gathering with no one present should be cancelled.
 */
export function parseHeadcountForm(adultsText: string, childrenText: string, note = ""): ParsedHeadcount {
  const adults = parseCount(adultsText, "Voksne");
  if (!adults.ok) return adults;
  const children = parseCount(childrenText, "Barn");
  if (!children.ok) return children;
  if (adults.value + children.value === 0) {
    return { ok: false, error: "Skriv inn hvor mange som var til stede." };
  }
  const trimmedNote = note.trim();
  return {
    ok: true,
    value: { adults: adults.value, children: children.value, ...(trimmedNote ? { note: trimmedNote } : {}) },
  };
}
