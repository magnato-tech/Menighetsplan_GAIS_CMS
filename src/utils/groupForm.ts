import type { Group, GroupCategory, MeetingSchedule } from "../types";
import { isGroupPublic } from "./visibility";

/** What an admin edits on a group. Text fields are kept as typed and cleaned when saved. */
export interface GroupFormValues {
  name: string;
  category: GroupCategory;
  description: string;
  /** Comma-separated, as typed */
  tags: string;
  leaderId: string;
  deputyId: string;
  isPublic: boolean;
  // A group without fixed meetings must not get a schedule just because the form was saved
  hasSchedule: boolean;
  weekday: string;
  time: string;
  frequency: MeetingSchedule["frequency"];
}

/** The form as it should look when the card opens: what is stored on the group. */
export function groupToForm(group: Group): GroupFormValues {
  return {
    name: group.name,
    category: group.category || "tjenestegruppe",
    description: group.description || "",
    tags: (group.tags || []).join(", "),
    leaderId: group.leaderIds[0] || "",
    deputyId: group.deputyLeaderIds?.[0] || "",
    isPublic: isGroupPublic(group),
    hasSchedule: Boolean(group.meetingSchedule),
    weekday: group.meetingSchedule?.weekday ?? "Søndag",
    time: group.meetingSchedule?.time ?? "11:00",
    frequency: group.meetingSchedule?.frequency ?? "hver uke",
  };
}

/** The tags as stored: split on commas, lower case, no empty ones. */
export function parseTags(text: string): string[] {
  return text
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/** What to store when the card is saved. Without a fixed meeting time the schedule is removed. */
export function formToGroupUpdates(form: GroupFormValues): Partial<Group> {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    tags: parseTags(form.tags),
    category: form.category,
    isPublic: form.isPublic,
    leaderIds: form.leaderId ? [form.leaderId] : [],
    deputyLeaderIds: form.deputyId ? [form.deputyId] : [],
    meetingSchedule: form.hasSchedule
      ? { weekday: form.weekday, time: form.time, frequency: form.frequency }
      : undefined,
  };
}
