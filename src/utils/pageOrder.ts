export type DropPosition = "before" | "after";

/** The ids with one of them moved to just before or after another. Unchanged when the target is not in the list. */
export function moveInList(list: string[], sourceId: string, targetId: string, position: DropPosition): string[] {
  const without = list.filter((id) => id !== sourceId);
  const targetIndex = without.indexOf(targetId);
  if (targetIndex === -1) return list;
  without.splice(position === "after" ? targetIndex + 1 : targetIndex, 0, sourceId);
  return without;
}

/** The ids with one of them moved a single place up or down, or null when it is already at that end or not in the list. */
export function stepInList(ids: string[], id: string, direction: "up" | "down"): string[] | null {
  const index = ids.indexOf(id);
  if (index === -1) return null;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ids.length) return null;
  const next = [...ids];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
}

/** Whether a pointer at `clientY` is over the upper or the lower half of a row. */
export function dropPositionAt(clientY: number, row: { top: number; height: number }): DropPosition {
  return clientY < row.top + row.height / 2 ? "before" : "after";
}
