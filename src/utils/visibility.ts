import { Gathering, GatheringVisibility } from "../types";

type VisibilitySource = Pick<Partial<Gathering>, "visibility" | "isPublic">;

/**
 * The visibility a gathering has in effect. `visibility` is the single source of truth.
 * Documents written before that field existed only carry `isPublic`, so it is used when
 * `visibility` is absent. A value this code does not know is treated as internal.
 */
export function visibilityOf(g: VisibilitySource): GatheringVisibility {
  if (g.visibility) return g.visibility === "offentlig" || g.visibility === "fremhevet" ? g.visibility : "intern";
  return g.isPublic === false ? "intern" : "offentlig";
}

export function isPubliclyVisible(g: VisibilitySource): boolean {
  return visibilityOf(g) !== "intern";
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
