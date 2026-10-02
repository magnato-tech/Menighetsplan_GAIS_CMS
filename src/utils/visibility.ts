import { Gathering, GatheringVisibility } from "../types";

/**
 * `visibility` is the single source of truth. Documents written before that
 * field existed only carry `isPublic`, so it is used when `visibility` is absent.
 */
export function isPubliclyVisible(g: Pick<Partial<Gathering>, "visibility" | "isPublic">): boolean {
  if (g.visibility) return g.visibility === "offentlig" || g.visibility === "fremhevet";
  return g.isPublic !== false;
}

/** The fields to store for a visibility. `isPublic` is written along with it so the two never disagree. */
export function visibilityFields(visibility: GatheringVisibility): { visibility: GatheringVisibility; isPublic: boolean } {
  return { visibility, isPublic: visibility !== "intern" };
}

/**
 * The visibility after a plain public / internal switch.
 * A featured gathering stays featured for as long as it is public.
 */
export function visibilityAfterToggle(
  current: GatheringVisibility | undefined,
  isPublic: boolean
): GatheringVisibility {
  if (!isPublic) return "intern";
  return current === "fremhevet" ? "fremhevet" : "offentlig";
}
