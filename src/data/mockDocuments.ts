import { COLLECTIONS, CMS_COLLECTIONS, CMS_SETTINGS_DOC_ID } from "./collections";
import {
  initialPersons,
  initialGroups,
  initialGatherings,
  initialTasks,
  initialAssignments,
  initialGroupMessages,
  initialGatheringAttendances,
} from "./mockData";
import {
  initialCmsPages,
  initialCmsNews,
  initialCmsSermons,
  initialCmsStaff,
  initialCmsSettings,
} from "./cmsData";

export interface MockDocument {
  collection: string;
  id: string;
  data: object;
}

/**
 * Every mock document, addressed by collection and document id.
 * This is demo content only and has no relation to a real congregation.
 */
export function getMockDocuments(): MockDocument[] {
  const sets: [string, { id: string }[]][] = [
    [COLLECTIONS.PERSONS, initialPersons],
    [COLLECTIONS.GROUPS, initialGroups],
    [COLLECTIONS.GATHERINGS, initialGatherings],
    [COLLECTIONS.TASKS, initialTasks],
    [COLLECTIONS.ASSIGNMENTS, initialAssignments],
    [COLLECTIONS.GROUP_MESSAGES, initialGroupMessages],
    [COLLECTIONS.GATHERING_ATTENDANCES, initialGatheringAttendances],
    [CMS_COLLECTIONS.PAGES, initialCmsPages],
    [CMS_COLLECTIONS.NEWS, initialCmsNews],
    [CMS_COLLECTIONS.SERMONS, initialCmsSermons],
    [CMS_COLLECTIONS.STAFF, initialCmsStaff],
  ];

  const documents: MockDocument[] = sets.flatMap(([collection, items]) =>
    items.map((item) => ({ collection, id: item.id, data: item }))
  );
  documents.push({ collection: CMS_COLLECTIONS.SETTINGS, id: CMS_SETTINGS_DOC_ID, data: initialCmsSettings });
  return documents;
}
