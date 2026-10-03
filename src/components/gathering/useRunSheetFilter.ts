import { useMemo, useState } from "react";
import type { RunSheetRow } from "../../utils/runSheet";
import { filterRunSheet, groupsInRunSheet, type RunSheetFilter } from "../../utils/gatheringView";

/** The view tabs and the group filter above the run sheet, and the rows they leave. */
export function useRunSheetFilter(rows: RunSheetRow[]) {
  const [view, setView] = useState<RunSheetFilter>("all");
  const [groupId, setGroupId] = useState("all");

  const groups = useMemo(() => groupsInRunSheet(rows), [rows]);
  const filtered = useMemo(() => filterRunSheet(rows, view, groupId), [rows, view, groupId]);

  return {
    view,
    groupId,
    groups,
    filtered,
    setView,
    setGroupId,
    reset: () => {
      setView("all");
      setGroupId("all");
    },
  };
}
