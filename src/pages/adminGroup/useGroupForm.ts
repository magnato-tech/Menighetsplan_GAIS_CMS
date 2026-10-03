import React, { useCallback, useEffect, useState } from "react";
import type { ActionResult } from "../../context/FirebaseDataContext";
import type { Group } from "../../types";
import { useTimedMessage } from "../../hooks/useTimedMessage";
import { formToGroupUpdates, groupToForm, type GroupFormValues } from "../../utils/groupForm";

export type SetGroupField = <K extends keyof GroupFormValues>(field: K, value: GroupFormValues[K]) => void;

export interface GroupFeedback {
  text: string;
  type: "success" | "error";
}

interface Options {
  group: Group | undefined;
  updateGroup: (groupId: string, updates: Partial<Group>) => ActionResult;
}

/** The group card's form: its values, the message shown after an action, and what saving does. */
export function useGroupForm({ group, updateGroup }: Options) {
  const [form, setForm] = useState<GroupFormValues | null>(() => (group ? groupToForm(group) : null));
  const [feedback, setFeedback] = useTimedMessage<GroupFeedback>();

  // The form follows the stored group, also when it changes underneath (for example after saving)
  useEffect(() => {
    setForm(group ? groupToForm(group) : null);
  }, [group]);

  const showFeedback = useCallback(
    (text: string, type: GroupFeedback["type"] = "success") => setFeedback({ text, type }),
    [setFeedback]
  );

  const setField: SetGroupField = useCallback(
    (field, value) => setForm((current) => (current ? { ...current, [field]: value } : current)),
    []
  );

  const save = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!group || !form) return;

    if (!form.name.trim()) {
      showFeedback("Gruppenavn kan ikke være tomt.", "error");
      return;
    }

    const res = updateGroup(group.id, formToGroupUpdates(form));
    if (res.success) {
      showFeedback("Gruppeinformasjon og møteplan ble lagret!");
    } else {
      showFeedback(res.error || "Kunne ikke lagre gruppe.", "error");
    }
  };

  return { form, setField, feedback, showFeedback, save };
}
