import type { Group, Task, VolunteerRole } from "../types";

/** Roles linked to the preferred team are listed first; the rest follow in sort order. */
export function sortVolunteerRoles(roles: VolunteerRole[], preferredGroupId?: string): VolunteerRole[] {
  if (!preferredGroupId) {
    return [...roles].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "nb"));
  }
  return [...roles].sort((a, b) => {
    const aMatch = a.groupId === preferredGroupId ? 0 : 1;
    const bMatch = b.groupId === preferredGroupId ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "nb");
  });
}

/** Leader ids for a team, in registration order. */
export function suggestedLeaderIds(group: Group | undefined): string[] {
  return group?.leaderIds ?? [];
}

/** An existing task on the same gathering with the same library role, if any. */
export function findExistingTaskForRole(
  tasks: Task[],
  gatheringId: string,
  volunteerRoleId: string
): Task | undefined {
  return tasks.find((t) => t.gatheringId === gatheringId && t.volunteerRoleId === volunteerRoleId);
}

function roleMap(roles: VolunteerRole[]): Map<string, VolunteerRole> {
  return new Map(roles.map((r) => [r.id, r]));
}

/** Instruction text for display: library role when linked, otherwise the task's own field. */
export function resolveTaskInstruction(
  task: Pick<Task, "volunteerRoleId" | "instruction" | "description">,
  roles: VolunteerRole[] | Map<string, VolunteerRole>
): string {
  const byId = roles instanceof Map ? roles : roleMap(roles);
  if (task.volunteerRoleId) {
    const role = byId.get(task.volunteerRoleId);
    if (role?.instruction) return role.instruction;
  }
  return task.instruction || task.description || "";
}

export function volunteerRoleById(roles: VolunteerRole[]): Map<string, VolunteerRole> {
  return roleMap(roles);
}
