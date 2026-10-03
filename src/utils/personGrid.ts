import type { Group, Person } from "../types";
import { allGroupPersonIds } from "./groups";
import { type PublicProfile, publicProfilesOf, toPublicProfile } from "./publicProfile";
import { isGroupPublic } from "./visibility";

/** A person in a grid. `roleInGroup` is only set when the grid shows a group, and comes from the group's own roles. */
export interface PersonGridProfile extends PublicProfile {
  roleInGroup?: "Leder" | "Nestleder";
}

export type PersonGridResult =
  | { kind: "people"; profiles: PersonGridProfile[] }
  | { kind: "no-group" }
  | { kind: "empty"; of: "group" | "ids" | "staff" };

const GROUP_KEYWORDS = new Set(["lederskap", "menighetsråd", "menighetsrad", "styre"]);
const CATEGORY_KEYWORDS = new Set(["pastor", "barneleder", "diakoni"]);

function groupGrid(filter: string, persons: Person[], groups: Group[]): PersonGridResult {
  const wanted = filter.replace(/^gruppe=/i, "").trim().replace(/^menighetsrad$/i, "menighetsråd");
  const publicGroups = groups.filter(isGroupPublic);
  // Leadership is volunteers and staff is employees, so a group is never found by its category: only by name or id
  const group = publicGroups.find(
    (g) => g.id === wanted || g.name.toLowerCase().includes(wanted.toLowerCase())
  );
  if (!group) return { kind: "no-group" };

  const leaders = new Set(group.leaderIds);
  const deputies = new Set(group.deputyLeaderIds ?? []);
  const profiles = publicProfilesOf(allGroupPersonIds(group), persons)
    .map<PersonGridProfile>((p) => ({
      ...p,
      roleInGroup: leaders.has(p.id) ? "Leder" : deputies.has(p.id) ? "Nestleder" : undefined,
    }))
    .sort((a, b) => Number(Boolean(b.roleInGroup === "Leder")) - Number(Boolean(a.roleInGroup === "Leder")) || a.name.localeCompare(b.name));
  return profiles.length ? { kind: "people", profiles } : { kind: "empty", of: "group" };
}

/**
 * Who a `:::personer[filter]` block shows. Only people with registered consent are
 * ever included, and nothing is filled in when the filter matches nobody.
 *
 * Filters: `stab`, `alle`, a category (`pastor`, `kategori=diakoni`), a group
 * (`lederskap`, `gruppe=<id or name>`), or person ids (`ids=a,b`).
 */
export function selectPersonGrid(filter: string, persons: Person[], groups: Group[]): PersonGridResult {
  const raw = filter.trim();
  const key = raw.toLowerCase();

  if (GROUP_KEYWORDS.has(key) || key.startsWith("gruppe=")) return groupGrid(raw, persons, groups);

  if (key.startsWith("ids=") || raw.includes(",") || persons.some((p) => p.id === raw)) {
    const ids = raw.replace(/^ids=/i, "").split(",").map((s) => s.trim()).filter(Boolean);
    const profiles = publicProfilesOf(ids, persons);
    return profiles.length ? { kind: "people", profiles } : { kind: "empty", of: "ids" };
  }

  const category = key.replace(/^kategori=/, "");
  const byCategory = key.startsWith("kategori=") || CATEGORY_KEYWORDS.has(key);
  const profiles = persons
    .filter((p) => {
      if (key === "alle") return true;
      if (byCategory) {
        return (
          p.staffCategory?.toLowerCase() === category ||
          p.staffRole?.toLowerCase().includes(category) ||
          p.publicTitle?.toLowerCase().includes(category)
        );
      }
      return Boolean(p.isStaff);
    })
    .map(toPublicProfile)
    .filter((p): p is PublicProfile => p !== null);
  return profiles.length ? { kind: "people", profiles } : { kind: "empty", of: "staff" };
}
