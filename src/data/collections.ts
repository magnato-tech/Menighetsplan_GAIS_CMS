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
  SETTINGS: "cms_settings",
} as const;

// cms_settings holds a single document
export const CMS_SETTINGS_DOC_ID = "global";

// No longer read or written, but a database may still hold documents in them, so "delete everything" still empties them
export const LEGACY_COLLECTIONS = ["cms_staff"] as const;

export const ALL_COLLECTIONS: readonly string[] = [
  ...Object.values(COLLECTIONS),
  ...Object.values(CMS_COLLECTIONS),
  ...LEGACY_COLLECTIONS,
];
