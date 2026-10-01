// Exact Domain Models requested for Menighetsplan

export interface Person {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  globalRole: "member" | "admin";
}

export type GroupCategory = "tjenestegruppe" | "husgruppe" | "strategigruppe" | "ledergruppe" | "interessegruppe";

export interface MeetingSchedule {
  weekday: string;
  time: string;
  frequency: "hver uke" | "annenhver uke" | "hver måned";
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  category?: GroupCategory;
  tags?: string[]; // e.g. "vekstgruppe", "menighetsskole", "stab", "friluft"
  isPublic?: boolean; // whether it is featured on the public website
  memberIds: string[];
  leaderIds: string[];
  deputyLeaderIds?: string[];
  meetingSchedule?: MeetingSchedule;
  memberJoinedAt?: Record<string, string>; // ISO date when person joined group
  notificationPreferences?: Record<string, boolean>; // personId -> true/false
}

export interface ProgramItem {
  id?: string;
  time: string;
  title: string;
  description?: string;
  taskId?: string;
  groupId?: string;
}

export interface Gathering {
  id: string;
  groupId: string;
  title: string;
  startsAt: string; // ISO date
  endsAt?: string; // ISO date, optional end time
  location?: string;
  type?: "arrangement" | "gruppesamling";
  theme?: string;
  bibleText?: string;
  hostPersonId?: string;
  invitationSent?: boolean;
  invitationSentAt?: string;
  isPublic?: boolean; // Whether event can be shown publicly on website
  isGudstjeneste?: boolean; // Whether this is a church service
  cancelled?: boolean; // Whether event is cancelled
  programSchedule?: ProgramItem[];
}

export interface GatheringAttendance {
  id: string;
  gatheringId: string;
  personId: string;
  status: "attending" | "declined"; // "attending" = KOMMER, "declined" = KOMMER IKKE
  updatedAt?: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderPersonId: string;
  senderName: string;
  content: string;
  imageUrl?: string; // Optional attached photo
  createdAt: string; // ISO date
}

export interface Task {
  id: string;
  gatheringId: string;
  groupId: string;
  title: string;
  description?: string;
  instruction?: string;
  status: "open" | "assigned" | "confirmed" | "vacant" | "cancelled";
  neededCount?: number;
}

export interface Assignment {
  id: string;
  taskId: string;
  personId: string;
  response: "pending" | "confirmed" | "declined" | "withdrawn";
}

// Presentation Model for reusable ActionCard component
export type BadgeVariant = "neutral" | "success" | "warning" | "urgent" | "info";

export interface ActionCardModel {
  id: string;
  taskId: string;
  title: string;
  gatheringTitle: string;
  dateTimeFormatted: string;
  groupName: string;
  location?: string;
  status: Task["status"];
  statusLabel: string;
  badgeVariant: BadgeVariant;
  primaryActionLabel?: string;
  primaryActionType?: "claim" | "absence" | "view";
  detailUrl: string;
  isAssignedToMe: boolean;
  assignedPersonName?: string;
}

export interface QueryResult<T> {
  data: T;
  loading: boolean;
  error: string | null;
  permissionDenied?: boolean;
}
