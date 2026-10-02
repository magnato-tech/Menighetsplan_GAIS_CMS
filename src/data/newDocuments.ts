import {
  Person,
  Group,
  Gathering,
  GatheringVisibility,
  Task,
  Assignment,
  GatheringAttendance,
  GroupMessage,
  GroupCategory,
  MeetingSchedule,
} from "../types";
import { newId } from "../utils/id";
import { visibilityFields } from "../utils/visibility";

// Each new document is built here exactly once. The same object goes into local
// state and into Firestore, so the two can never disagree on the id or the defaults.

const DEFAULT_GROUP_ID = "group-lyd";

export interface NewPersonInput {
  name: string;
  phone?: string;
  email?: string;
  globalRole?: "member" | "admin";
}

export interface NewGroupInput {
  name: string;
  description?: string;
  category?: GroupCategory;
  tags?: string[];
  isPublic?: boolean;
  leaderIds?: string[];
  deputyLeaderIds?: string[];
  memberIds?: string[];
  meetingSchedule?: MeetingSchedule;
}

export interface NewGatheringInput {
  groupId?: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  type?: "arrangement" | "gruppesamling";
  theme?: string;
  bibleText?: string;
  hostPersonId?: string;
  visibility?: GatheringVisibility;
  isGudstjeneste?: boolean;
  cancelled?: boolean;
  sendInvitationImmediately?: boolean;
}

export interface NewTaskInput {
  gatheringId: string;
  groupId: string;
  title: string;
  description?: string;
  instruction?: string;
  status?: Task["status"];
  neededCount?: number;
}

export function buildPerson(data: NewPersonInput): Person {
  return {
    id: newId("person"),
    name: data.name.trim(),
    phone: data.phone?.trim() || "",
    email: data.email?.trim() || "",
    globalRole: data.globalRole || "member",
  };
}

export function buildGroup(data: NewGroupInput): Group {
  return {
    id: newId("group"),
    name: data.name.trim(),
    description: data.description?.trim(),
    category: data.category || "tjenestegruppe",
    tags: data.tags || [],
    isPublic: data.isPublic !== false,
    leaderIds: data.leaderIds || [],
    deputyLeaderIds: data.deputyLeaderIds || [],
    memberIds: data.memberIds || [],
    meetingSchedule: data.meetingSchedule,
  };
}

export function buildGathering(data: NewGatheringInput): Gathering {
  // `visibility` is the single source of truth; `isPublic` only mirrors it for older readers.
  const visibility = data.visibility || (data.type === "gruppesamling" ? "intern" : "offentlig");
  return {
    id: newId("gathering"),
    groupId: data.groupId || DEFAULT_GROUP_ID,
    title: data.title.trim(),
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    location: data.location,
    type: data.type || "arrangement",
    theme: data.theme,
    bibleText: data.bibleText,
    hostPersonId: data.hostPersonId,
    invitationSent: !!data.sendInvitationImmediately,
    invitationSentAt: data.sendInvitationImmediately ? new Date().toISOString() : undefined,
    ...visibilityFields(visibility),
    isGudstjeneste: data.isGudstjeneste ?? (data.type === "arrangement"),
    cancelled: data.cancelled ?? false,
  };
}

export function buildTask(data: NewTaskInput): Task {
  return {
    id: newId("task"),
    gatheringId: data.gatheringId,
    groupId: data.groupId,
    title: data.title.trim(),
    description: data.description,
    instruction: data.instruction,
    status: data.status || "open",
    neededCount: data.neededCount || 1,
  };
}

export function buildAssignment(
  taskId: string,
  personId: string,
  response: "confirmed" | "pending"
): Assignment {
  return {
    id: newId(`assign-${taskId}-${personId}`),
    taskId,
    personId,
    response,
  };
}

/**
 * A person's answer to a gathering. The id is made from the two, so each person
 * has one answer per gathering and a new answer replaces the old one.
 */
export function buildAttendance(
  gatheringId: string,
  personId: string,
  status: GatheringAttendance["status"]
): GatheringAttendance {
  return {
    id: `att-${gatheringId}-${personId}`,
    gatheringId,
    personId,
    status,
    updatedAt: new Date().toISOString(),
  };
}

export function buildGroupMessage(
  groupId: string,
  sender: Pick<Person, "id" | "name">,
  content: string,
  imageUrl?: string
): GroupMessage {
  return {
    id: newId("msg"),
    groupId,
    senderPersonId: sender.id,
    senderName: sender.name,
    content: content.trim(),
    imageUrl,
    createdAt: new Date().toISOString(),
  };
}
