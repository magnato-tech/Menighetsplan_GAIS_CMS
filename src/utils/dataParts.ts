import { CMS_COLLECTIONS, COLLECTIONS } from "../data/collections";
import type { Gathering } from "../types";
import type { DatasetDocument } from "./dataset";
import { isOpenCommunityGathering } from "./gatherings";

// The database holds two things that are filled and emptied apart from each other:
//
//   the website   pages, news, sermons, staff, settings, and the events open to everyone
//   the planner   persons, groups, volunteer roles, tasks, internal gatherings, messages, attendance
//
// A congregation's own website content can then be in place while the planner is filled with
// test persons, or the other way round, without one overwriting the other.
//
// Events are the one collection both read. An event open to everyone belongs to the website;
// a group's own gathering belongs to the planner. A group that only exists to own the website's
// events (no members, no leaders) follows the website.

export type DataPart = "website" | "planner";

export const DATA_PARTS: readonly DataPart[] = ["website", "planner"];

export const DATA_PART_LABELS: Record<DataPart, string> = {
  website: "Nettsiden",
  planner: "Planleggeren",
};

/** What each part holds, in the words the admin screens use. */
export const DATA_PART_CONTENTS: Record<DataPart, string> = {
  website: "sider, nyheter, taler, stab, innstillinger og offentlige arrangementer",
  planner: "personer, grupper, tjenesteroller, oppgaver, interne samlinger, meldinger og oppmøte",
};

type Collections = Record<string, DatasetDocument[]>;

const CMS_COLLECTION_NAMES = new Set<string>(Object.values(CMS_COLLECTIONS));
const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []);

/** An event open to the whole congregation and to visitors, as the public calendar shows it. */
export function isWebsiteGathering(gathering: DatasetDocument): boolean {
  return isOpenCommunityGathering(gathering as unknown as Partial<Gathering>);
}

/**
 * Groups that only exist to own the website's events: no members, no leaders, at least one
 * gathering, and every gathering of theirs open to everyone.
 */
export function calendarGroupIds(collections: Collections): Set<string> {
  const gatherings = collections[COLLECTIONS.GATHERINGS] ?? [];
  const ids = new Set<string>();
  for (const group of collections[COLLECTIONS.GROUPS] ?? []) {
    if (strings(group.memberIds).length > 0 || strings(group.leaderIds).length > 0) continue;
    const own = gatherings.filter((g) => g.groupId === group.id);
    if (own.length > 0 && own.every(isWebsiteGathering)) ids.add(group.id);
  }
  return ids;
}

/** Which part a document belongs to. `calendarGroups` comes from calendarGroupIds. */
export function partOf(collection: string, document: DatasetDocument, calendarGroups: Set<string>): DataPart {
  if (CMS_COLLECTION_NAMES.has(collection)) return "website";
  if (collection === COLLECTIONS.GATHERINGS) return isWebsiteGathering(document) ? "website" : "planner";
  if (collection === COLLECTIONS.GROUPS) return calendarGroups.has(document.id) ? "website" : "planner";
  return "planner";
}

/** The documents that belong to the given parts. Collections left empty are dropped. */
export function keepParts(collections: Collections, parts: readonly DataPart[]): Collections {
  const calendarGroups = calendarGroupIds(collections);
  const kept: Collections = {};
  for (const [collection, documents] of Object.entries(collections)) {
    const own = documents.filter((document) => parts.includes(partOf(collection, document, calendarGroups)));
    if (own.length > 0) kept[collection] = own;
  }
  return kept;
}

/** How many documents each part holds. */
export function countByPart(collections: Collections): Record<DataPart, number> {
  const calendarGroups = calendarGroupIds(collections);
  const counts: Record<DataPart, number> = { website: 0, planner: 0 };
  for (const [collection, documents] of Object.entries(collections)) {
    for (const document of documents) counts[partOf(collection, document, calendarGroups)]++;
  }
  return counts;
}

export interface DocumentAddress {
  collection: string;
  id: string;
}

/**
 * Every document to delete when the given parts are emptied.
 *
 * Emptying the website alone also removes what hangs on its events: the tasks on them, the
 * assignments to those tasks, and the responses and headcounts. They are planner documents,
 * but without the event they point at nothing.
 */
export function documentsToDelete(collections: Collections, parts: readonly DataPart[]): DocumentAddress[] {
  const doomed = keepParts(collections, parts);
  const addresses = new Map<string, DocumentAddress>();
  const add = (collection: string, id: string) => addresses.set(`${collection}/${id}`, { collection, id });
  for (const [collection, documents] of Object.entries(doomed)) for (const document of documents) add(collection, document.id);

  const goneGatherings = new Set((doomed[COLLECTIONS.GATHERINGS] ?? []).map((g) => g.id));
  const goneTasks = new Set<string>();
  for (const task of collections[COLLECTIONS.TASKS] ?? []) {
    if (goneGatherings.has(String(task.gatheringId))) {
      goneTasks.add(task.id);
      add(COLLECTIONS.TASKS, task.id);
    }
  }
  for (const assignment of collections[COLLECTIONS.ASSIGNMENTS] ?? []) {
    if (goneTasks.has(String(assignment.taskId))) add(COLLECTIONS.ASSIGNMENTS, assignment.id);
  }
  for (const name of [COLLECTIONS.GATHERING_ATTENDANCES, COLLECTIONS.GATHERING_HEADCOUNTS]) {
    for (const document of collections[name] ?? []) {
      if (goneGatherings.has(String(document.gatheringId))) add(name, document.id);
    }
  }
  return [...addresses.values()];
}
