import { useState } from "react";
import type { EditableTask, InstructionTarget } from "./gatheringDetail";

/** Which dialog is open on the gathering page, with what, and which person's status menu is open. */
export function useGatheringDialogs() {
  const [openMenuAssignmentId, setOpenMenuAssignmentId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState<InstructionTarget | null>(null);
  const [assignTaskId, setAssignTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<EditableTask | null>(null);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isEditingGathering, setIsEditingGathering] = useState(false);

  return {
    openMenuAssignmentId,
    instruction,
    assignTaskId,
    editingTask,
    isCreatingTask,
    isEditingGathering,
    setOpenMenuAssignmentId,
    setInstruction,
    setAssignTaskId,
    setEditingTask,
    setIsCreatingTask,
    setIsEditingGathering,
  };
}
