// Names of every Firestore collection the app reads or writes.

export const COLLECTIONS = {
  PERSONS: "persons",
  GROUPS: "groups",
  GATHERINGS: "gatherings",
  TASKS: "tasks",
  ASSIGNMENTS: "assignments",
  GROUP_MESSAGES: "groupMessages",
  GATHERING_ATTENDANCES: "gatheringAttendances",
  GATHERING_HEADCOUNTS: "gatheringHeadcounts",
  VOLUNTEER_ROLES: "volunteer_roles",
} as const;

export const CMS_COLLECTIONS = {
  PAGES: "cms_pages",
  NEWS: "cms_news",
  SERMONS: "cms_sermons",
  STAFF: "cms_staff",
  SETTINGS: "cms_settings",
  MEDIA: "cms_media",
} as const;

// cms_settings holds a single document
export const CMS_SETTINGS_DOC_ID = "global";

export const ALL_COLLECTIONS: readonly string[] = [
  ...Object.values(COLLECTIONS),
  ...Object.values(CMS_COLLECTIONS),
];
