import type React from "react";
import { useState } from "react";
import { dropPositionAt, moveInList, type DropPosition } from "../../../../utils/pageOrder";

interface DragState {
  id: string;
  /** The parent of the page being dragged, or null for a main tab */
  parentId: string | null;
  overId: string | null;
  position: DropPosition | null;
}

/**
 * Drag and drop for reordering pages. A main tab can only be dropped among the main tabs, and a sub-page
 * only among the sub-pages of its own parent (`parentId`). Anything else is ignored.
 */
export function usePageDragReorder(onReorder?: (orderedIds: string[]) => void) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const end = () => setDrag(null);

  const sameLevel = (parentId: string | null) => drag !== null && drag.parentId === parentId;

  const start = (e: React.DragEvent, id: string, parentId: string | null) => {
    // A sub-page sits inside its parent's row, which has its own drag handlers
    if (parentId !== null) e.stopPropagation();
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
    setDrag({ id, parentId, overId: null, position: null });
  };

  const over = (e: React.DragEvent, targetId: string, parentId: string | null) => {
    if (!drag || !sameLevel(parentId) || drag.id === targetId) return;
    e.preventDefault();
    if (parentId !== null) e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDrag({ ...drag, overId: targetId, position: dropPositionAt(e.clientY, e.currentTarget.getBoundingClientRect()) });
  };

  const drop = (e: React.DragEvent, targetId: string, parentId: string | null, siblingIds: string[]) => {
    e.preventDefault();
    if (parentId !== null) e.stopPropagation();
    if (!drag || !sameLevel(parentId) || drag.id === targetId || !drag.position) {
      end();
      return;
    }
    onReorder?.(moveInList(siblingIds, drag.id, targetId, drag.position));
    end();
  };

  return {
    draggingId: drag?.id ?? null,
    overId: drag?.overId ?? null,
    position: drag?.position ?? null,
    start,
    over,
    drop,
    end,
  };
}

export type PageDrag = ReturnType<typeof usePageDragReorder>;
