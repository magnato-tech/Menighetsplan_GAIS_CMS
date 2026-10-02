// Exact Domain Models requested for Menighetsplan

export interface UnavailablePeriod {
  from: string; // ISO date YYYY-MM-DD
  to: string;   // ISO date YYYY-MM-DD
  reason?: string;
}

export interface Person {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  globalRole: "member" | "admin";
  policeCertificateValidUntil?: string; // ISO date YYYY-MM-DD
  unavailablePeriods?: UnavailablePeriod[];
  // GDPR & Public Stabs-profil
  isPublicProfile?: boolean;
  publicTitle?: string;
  publicPhone?: string;
  publicEmail?: string;
  avatarUrl?: string;
  consentToPublishGivenAt?: string; // ISO timestamp
  consentGivenBy?: string; // UID of admin who registered consent
  updatedBy?: string;
  updatedAt?: string;
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
  tags?: string[];
  isPublic?: boolean;
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

export type GatheringVisibility = "intern" | "offentlig" | "fremhevet";

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
  // Unified single source of visibility
  visibility: GatheringVisibility;
  isPublic?: boolean; // backwards compatibility alias for visibility !== "intern"
  isGudstjeneste?: boolean; // Whether this is a church service
  cancelled?: boolean; // Whether event is cancelled
  programSchedule?: ProgramItem[];
  updatedBy?: string;
  updatedAt?: string;
}

export type Event = Gathering;

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
  // Absent when an admin has reset the need to "not set"; readers then count it as 1
  neededCount?: number;
  lastReminded?: string; // ISO timestamp when reminder was sent/copied
  updatedBy?: string;
  updatedAt?: string;
}

export interface Assignment {
  id: string;
  taskId: string;
  personId: string;
  response: "pending" | "confirmed" | "declined" | "withdrawn";
  assignedAt?: string;
  respondedAt?: string;
  withdrawalReason?: string;
}
