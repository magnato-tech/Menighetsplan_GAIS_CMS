import { useMemo, useState } from "react";
import {
  activityTableRows,
  countVacantTasks,
  filterActivities,
  monthFilterOptions,
  type ActivityItem,
  type StatusFilter,
} from "../../../utils/groupActivities";

export type ActivitiesViewMode = "kort" | "tabell";

/**
 * What the activity overview shows: the filters, cards or table, which card is open, and which task has the
 * assignment drawer open. Called once by the section, which passes the result down.
 */
export function useGroupActivitiesView<T extends ActivityItem>(groupGatherings: T[]) {
  const [month, setMonth] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ActivitiesViewMode>("kort");
  const [expandedGatheringId, setExpandedGatheringId] = useState<string | null>(null);
  const [quickAssignTaskId, setQuickAssignTaskId] = useState<string | null>(null);

  const monthOptions = useMemo(() => monthFilterOptions(groupGatherings), [groupGatherings]);
  const filtered = useMemo(() => filterActivities(groupGatherings, month, status), [groupGatherings, month, status]);
  const tableRows = useMemo(() => activityTableRows(filtered), [filtered]);
  const vacantTasks = useMemo(() => countVacantTasks(groupGatherings), [groupGatherings]);

  return {
    month,
    status,
    viewMode,
    expandedGatheringId,
    quickAssignTaskId,
    monthOptions,
    filtered,
    tableRows,
    vacantTasks,
    setMonth,
    setStatus,
    setViewMode,
    toggleExpanded: (gatheringId: string) => setExpandedGatheringId((open) => (open === gatheringId ? null : gatheringId)),
    toggleQuickAssign: (taskId: string) => setQuickAssignTaskId((open) => (open === taskId ? null : taskId)),
    closeQuickAssign: () => setQuickAssignTaskId(null),
    /** Only the red ones, across all months */
    showVacantOnly: () => {
      setStatus("red");
      setMonth("all");
    },
    /** From the table: back to the cards, with the task's drawer open */
    openAssignment: (gatheringId: string, taskId: string) => {
      setExpandedGatheringId(gatheringId);
      setQuickAssignTaskId(taskId);
      setViewMode("kort");
    },
  };
}
