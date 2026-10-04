import type { useLeaderGatheringDetail } from "../../hooks/leaderHooks";

/**
 * Everything useLeaderGatheringDetail returns. GatheringDetailView calls the hook
 * once and hands the result to its dialogs.
 */
export type GatheringDetail = ReturnType<typeof useLeaderGatheringDetail>;

/** What the instruction dialog was opened for. */
export interface InstructionTarget {
  taskId?: string;
  title: string;
  instruction: string;
  volunteerRoleId?: string;
  time?: string;
  groupName?: string;
}

/** The fields of a task that the edit dialog works on. */
export interface EditableTask {
  id: string;
  title: string;
  volunteerRoleId?: string;
  groupId?: string;
  neededCount: number;
  description: string;
}
