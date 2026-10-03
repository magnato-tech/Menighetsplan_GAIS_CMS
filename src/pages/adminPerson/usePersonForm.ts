import React, { useCallback, useEffect, useState } from "react";
import type { ActionResult } from "../../context/FirebaseDataContext";
import type { Person } from "../../types";
import { useTimedMessage } from "../../hooks/useTimedMessage";
import { compressImageFile } from "../../utils/imageUpload";
import { formToPersonUpdates, personToForm, type PersonFormValues } from "../../utils/personForm";

export type SetPersonField = <K extends keyof PersonFormValues>(field: K, value: PersonFormValues[K]) => void;

export interface PersonFeedback {
  text: string;
  type: "success" | "error";
}

interface Options {
  person: Person | undefined;
  adminId: string;
  updatePerson: (personId: string, updates: Partial<Person>) => ActionResult;
}

/** The person card's form: its values, the message shown after an action, and what saving and uploading do. */
export function usePersonForm({ person, adminId, updatePerson }: Options) {
  const [form, setForm] = useState<PersonFormValues | null>(() => (person ? personToForm(person) : null));
  const [feedback, setFeedback] = useTimedMessage<PersonFeedback>();

  // The form follows the stored person, also when it changes underneath (for example after saving)
  useEffect(() => {
    setForm(person ? personToForm(person) : null);
  }, [person]);

  const showFeedback = useCallback(
    (text: string, type: PersonFeedback["type"] = "success") => setFeedback({ text, type }),
    [setFeedback]
  );

  const setField: SetPersonField = useCallback(
    (field, value) => setForm((current) => (current ? { ...current, [field]: value } : current)),
    []
  );

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageFile(file, { maxDimension: 500, quality: 0.85 });
      setField("avatarUrl", dataUrl);
      showFeedback("Portrettbilde klargjort! Husk å trykke lagre.");
    } catch (err) {
      showFeedback(err instanceof Error ? err.message : "Kunne ikke laste bilde.", "error");
    }
  };

  const save = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!person || !form) return;

    if (!form.name.trim()) {
      showFeedback("Navn kan ikke være tomt.", "error");
      return;
    }

    const res = updatePerson(person.id, formToPersonUpdates(person, form, adminId));
    if (res.success) {
      showFeedback("Personopplysninger og tilganger ble lagret!");
    } else {
      showFeedback(res.error || "Kunne ikke lagre person.", "error");
    }
  };

  return { form, setField, feedback, showFeedback, uploadAvatar, save };
}
