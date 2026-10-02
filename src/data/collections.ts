// Names of every Firestore collection the app reads or writes.

export const COLLECTIONS = {
  PERSONS: "persons",
  GROUPS: "groups",
  GATHERINGS: "gatherings",
  TASKS: "tasks",
  ASSIGNMENTS: "assignments",
  GROUP_MESSAGES: "groupMessages",
  GATHERING_ATTENDANCES: "gatheringAttendances",
} as const;

export const CMS_COLLECTIONS = {
  PAGES: "cms_pages",
  NEWS: "cms_news",
  SERMONS: "cms_sermons",
  STAFF: "cms_staff",
  SETTINGS: "cms_settings",
} as const;

// cms_settings holds a single document
export const CMS_SETTINGS_DOC_ID = "global";

// Kept apart from CMS_COLLECTIONS because it has no mock data: a document only
// exists once an admin has featured or hidden a gathering.
export const CMS_OVERRIDES_COLLECTION = "cms_overrides";

export const ALL_COLLECTIONS: readonly string[] = [
  ...Object.values(COLLECTIONS),
  ...Object.values(CMS_COLLECTIONS),
  CMS_OVERRIDES_COLLECTION,
];
