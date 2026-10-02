// What "Trenger din oppmerksomhet" on Min side can hold, and how each kind reads.

interface AttentionBase {
  id: string;
  title: string;
  /** Empty when the gathering is unknown. */
  startsAt: string;
  location?: string;
  groupName?: string;
}

export type AttentionItem =
  /** A leader has asked the user to take a task. */
  | (AttentionBase & { type: "task_request"; assignmentId: string; taskDescription?: string })
  /** A gathering in one of the user's groups that they have not answered. */
  | (AttentionBase & { type: "unanswered_invitation"; gatheringId: string; theme?: string })
  /** A task in one of the user's groups with a free slot. */
  | (AttentionBase & { type: "open_task"; taskId: string; taskDescription?: string; needsSubstitute: boolean });

export interface AttentionText {
  label: string;
  note?: string;
  /** The button that says yes. */
  yes: string;
  /** The button that says no, for the kinds that can be turned down. */
  no?: string;
}

export function attentionText(item: AttentionItem): AttentionText {
  switch (item.type) {
    case "task_request":
      return { label: "Forespørsel til deg", note: item.taskDescription, yes: "Ja, jeg kan", no: "Kan ikke" };
    case "unanswered_invitation":
      return { label: "Innkalling", note: item.theme ? `Tema: ${item.theme}` : undefined, yes: "Kommer", no: "Kan ikke" };
    case "open_task":
      return {
        // "Vikar" only when someone has pulled out at short notice; otherwise the task was simply never filled
        label: item.needsSubstitute ? "Trenger vikar" : "Ledig oppgave",
        note: item.taskDescription,
        yes: "Ta oppgave",
      };
  }
}
