import { describe } from "vitest";
import { assert } from "./assert";
import { isInGroup, allGroupPersonIds } from "../src/utils/groups";

describe("Hvem som er med i en gruppe", () => {
  const group = { memberIds: ["medlem", "leder"], leaderIds: ["leder"], deputyLeaderIds: ["nestleder"] };

  assert(isInGroup(group, "medlem"), "Et medlem er med i gruppen");
  assert(isInGroup(group, "leder"), "En leder er med i gruppen");
  assert(isInGroup(group, "nestleder"), "En nestleder er med, også uten å stå som medlem");
  assert(!isInGroup(group, "utenfor"), "En som ikke står noe sted er ikke med");
  assert(!isInGroup({ memberIds: [], leaderIds: [] }, "medlem"), "En gruppe uten nestleder-liste tåles");

  assert(
    allGroupPersonIds(group).join(",") === "medlem,leder,nestleder",
    "Alle i gruppen listes én gang, også den som både er medlem og leder"
  );
  assert(allGroupPersonIds({ memberIds: ["a"], leaderIds: [] }).join(",") === "a", "En gruppe uten ledere gir bare medlemmene");
});
