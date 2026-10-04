import { describe } from "vitest";
import { assert } from "./assert";
import {
  findExistingTaskForRole,
  resolveTaskInstruction,
  sortVolunteerRoles,
  suggestedLeaderIds,
} from "../src/utils/roleStaffing";
import type { Group, Task, VolunteerRole } from "../src/types";

describe("Rollebemanning", () => {
  const roles: VolunteerRole[] = [
    { id: "r-lyd", name: "Lyd", groupId: "group-lyd", sortOrder: 2 },
    { id: "r-taler", name: "Taler", sortOrder: 0 },
    { id: "r-kaffe", name: "Kjøkken", groupId: "group-kjokken", sortOrder: 1 },
  ];

  assert(
    sortVolunteerRoles(roles, "group-lyd").map((r) => r.id).join(",") === "r-lyd,r-taler,r-kaffe",
    "Rollen til valgt team kommer først"
  );
  assert(
    sortVolunteerRoles(roles).map((r) => r.id).join(",") === "r-taler,r-kaffe,r-lyd",
    "Uten valgt team sorteres rollene på sortOrder"
  );

  const group: Group = { id: "group-lyd", name: "Lyd", memberIds: [], leaderIds: ["p-leader", "p-deputy"] };
  assert(suggestedLeaderIds(group).join(",") === "p-leader,p-deputy", "Lederforslag kommer fra teamet");
  assert(suggestedLeaderIds(undefined).length === 0, "Uten team er det ingen lederforslag");

  const tasks: Task[] = [
    { id: "t1", gatheringId: "g1", volunteerRoleId: "r-lyd", title: "Lyd", status: "open" },
    { id: "t2", gatheringId: "g2", volunteerRoleId: "r-lyd", title: "Lyd", status: "open" },
    { id: "t3", gatheringId: "g1", volunteerRoleId: "r-kaffe", title: "Kjøkken", status: "open" },
  ];
  assert(findExistingTaskForRole(tasks, "g1", "r-lyd")?.id === "t1", "Finner eksisterende oppgave med samme rolle på samme samling");
  assert(findExistingTaskForRole(tasks, "g1", "r-taler") === undefined, "Finner ikke oppgave når rollen ikke finnes");

  const libraryTask: Task = { id: "t4", gatheringId: "g1", volunteerRoleId: "r-lyd", title: "Lyd", instruction: "gammel", status: "open" };
  roles[0] = { ...roles[0], instruction: "Møt opp kl. 09:30." };
  assert(resolveTaskInstruction(libraryTask, roles) === "Møt opp kl. 09:30.", "Instruks leses fra biblioteket");
  const legacyTask: Task = { id: "t5", gatheringId: "g1", title: "Vert", instruction: "Stå i døra", status: "open" };
  assert(resolveTaskInstruction(legacyTask, roles) === "Stå i døra", "Eldre oppgaver bruker task.instruction");
});
