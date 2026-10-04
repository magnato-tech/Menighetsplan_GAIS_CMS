import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { sanitizeForFirestore } from "../utils/firestoreData";
import { COLLECTIONS, CMS_COLLECTIONS } from "../data/collections";
import {
  getCustomMockDocuments,
  type MockDocument,
  type CustomMockCounts,
} from "../data/mockDocuments";
import { chunk } from "../utils/chunk";
import { VOLUNTEER_ROLE_RECORD, volunteerRoleFields } from "./volunteerRoles";
import type { VolunteerRole } from "../types";

// Firestore støtter maksimalt 500 operasjoner per batch write
const BATCH_SIZE = 400;

export interface TestdataCounts extends CustomMockCounts {
  personCount?: number;
  groupCount?: number;
  roleCount?: number;
  gatheringCount?: number;
  taskCount?: number;
}

export interface GenerateTestdataOptions extends TestdataCounts {
  /**
   * Hvis satt til true, tømmes eksisterende testdata (personer, grupper, roller/oppgaver)
   * før ny generering starter. CMS-sider og nyheter bevares trygt.
   */
  clearExisting?: boolean;
}

export interface ClearTestdataOptions {
  /** Slett testpersoner (standard: true) */
  persons?: boolean;
  /** Slett grupper (standard: true) */
  groups?: boolean;
  /** Slett oppgavetildelinger (standard: true) */
  roles?: boolean;
  /** Slett rollebiblioteket (standard: true) */
  volunteerRoles?: boolean;
  /** Slett samlinger (standard: true) */
  gatherings?: boolean;
  /** Slett oppgaver (standard: true) */
  tasks?: boolean;
  /** Slett gruppemeldinger (standard: true) */
  groupMessages?: boolean;
  /** Slett oppmøteregistreringer (standard: true) */
  attendance?: boolean;
  /**
   * Sikkerhetssperre: Bevar alltid CMS-innhold (sider, artikler, taler, offentlige profiler og innstillinger).
   * Standard: true.
   */
  preserveCms?: boolean;
}

export interface TestdataServiceResult {
  success: boolean;
  /** Antall dokumenter skrevet eller slettet per samling */
  counts: Record<string, number>;
  total: number;
  /** Eventuelle feil under kjøring per samling */
  failures: { collection: string; message: string }[];
  durationMs?: number;
}

function createEmptyResult(): TestdataServiceResult {
  return {
    success: true,
    counts: {},
    total: 0,
    failures: [],
  };
}

function recordFailure(
  result: TestdataServiceResult,
  collectionName: string,
  error: unknown
): void {
  console.error(`TestdataService: Feil for samling '${collectionName}':`, error);
  result.success = false;
  result.failures.push({
    collection: collectionName,
    message: error instanceof Error ? error.message : String(error),
  });
}

/**
 * Tømmer spesifiserte testdata-samlinger fra Firestore.
 * Standardinnstillingen sletter alle planlegger-relaterte data (personer, grupper, roller/tildelinger),
 * men BEVARER ALT CMS-innhold (sider, artikler, taler og globale innstillinger).
 */
export async function clearTestdata(
  options: ClearTestdataOptions = {}
): Promise<TestdataServiceResult> {
  const startTime = Date.now();
  const result = createEmptyResult();

  const {
    persons = true,
    groups = true,
    roles = true,
    volunteerRoles = true,
    gatherings = true,
    tasks = true,
    groupMessages = true,
    attendance = true,
  } = options;

  // Bestem hvilke samlinger som skal slettes
  const targetCollections: string[] = [];
  if (persons) targetCollections.push(COLLECTIONS.PERSONS);
  if (groups) targetCollections.push(COLLECTIONS.GROUPS);
  if (roles || tasks) targetCollections.push(COLLECTIONS.ASSIGNMENTS);
  if (tasks) targetCollections.push(COLLECTIONS.TASKS);
  if (gatherings) targetCollections.push(COLLECTIONS.GATHERINGS);
  if (groupMessages) targetCollections.push(COLLECTIONS.GROUP_MESSAGES);
  if (attendance) targetCollections.push(COLLECTIONS.GATHERING_ATTENDANCES);
  if (volunteerRoles) targetCollections.push(COLLECTIONS.VOLUNTEER_ROLES);

  // Sikre at CMS-samlinger aldri slettes
  const protectedCollections = new Set(Object.values(CMS_COLLECTIONS));
  const safeCollections = targetCollections.filter(
    (name) => !protectedCollections.has(name as any)
  );

  for (const collectionName of safeCollections) {
    try {
      if (collectionName === COLLECTIONS.VOLUNTEER_ROLES) {
        const snap = await getDocs(collection(db, CMS_COLLECTIONS.SETTINGS));
        const roleDocs = snap.docs.filter((d) => d.data().recordType === VOLUNTEER_ROLE_RECORD);
        if (roleDocs.length > 0) {
          for (const piece of chunk(roleDocs, BATCH_SIZE)) {
            const batch = writeBatch(db);
            for (const docSnap of piece) batch.delete(docSnap.ref);
            await batch.commit();
          }
        }
        result.counts[collectionName] = roleDocs.length;
        result.total += roleDocs.length;
        continue;
      }
      const snap = await getDocs(collection(db, collectionName));
      if (!snap.empty) {
        for (const piece of chunk(snap.docs, BATCH_SIZE)) {
          const batch = writeBatch(db);
          for (const docSnap of piece) {
            batch.delete(docSnap.ref);
          }
          await batch.commit();
        }
      }
      result.counts[collectionName] = snap.size;
      result.total += snap.size;
    } catch (error) {
      recordFailure(result, collectionName, error);
    }
  }

  result.durationMs = Date.now() - startTime;
  result.success = result.failures.length === 0;
  return result;
}

/**
 * Sletter kun testpersoner og tilhørende tildelinger i Firestore.
 */
export async function deletePersonsTestdata(): Promise<TestdataServiceResult> {
  return clearTestdata({
    persons: true,
    roles: true,
    groups: false,
    gatherings: false,
    tasks: false,
    groupMessages: false,
    attendance: false,
  });
}

/**
 * Sletter kun testgrupper og tilhørende samlinger/oppgaver i Firestore.
 */
export async function deleteGroupsTestdata(): Promise<TestdataServiceResult> {
  return clearTestdata({
    persons: false,
    roles: false,
    groups: true,
    gatherings: true,
    tasks: true,
    groupMessages: true,
    attendance: true,
  });
}

/**
 * Sletter roller og tildelinger i Firestore.
 */
export async function deleteRolesTestdata(): Promise<TestdataServiceResult> {
  return clearTestdata({
    persons: false,
    groups: false,
    roles: true,
    volunteerRoles: true,
    gatherings: false,
    tasks: false,
    groupMessages: false,
    attendance: false,
  });
}

/**
 * Genererer et konsistent sett med testdata for personer, grupper og roller i Firestore.
 * Opprettholder referanseintegritet mellom medlemmer, grupper, oppgaver og lederroller.
 */
export async function generateTestdata(
  options: GenerateTestdataOptions = {}
): Promise<TestdataServiceResult> {
  const startTime = Date.now();
  const result = createEmptyResult();

  // 1. Tøm eksisterende hvis valgt
  if (options.clearExisting) {
    const clearRes = await clearTestdata();
    if (!clearRes.success) {
      result.failures.push(...clearRes.failures);
    }
  }

  // 2. Klargjør mock-dokumenter med konsistente relasjoner
  const counts: CustomMockCounts = {
    personCount: options.personCount !== undefined ? Math.max(1, options.personCount) : 32,
    groupCount: options.groupCount !== undefined ? Math.max(1, options.groupCount) : 14,
    roleCount: options.roleCount !== undefined ? Math.max(0, options.roleCount) : 14,
    gatheringCount: options.gatheringCount,
    taskCount: options.taskCount,
  };

  const rawDocs = getCustomMockDocuments(counts);

  // Grupper dokumenter per samling
  const byCollection = new Map<string, MockDocument[]>();
  for (const docItem of rawDocs) {
    // Verifiser at CMS-samlinger ikke overskrives utilsiktet herfra
    const list = byCollection.get(docItem.collection) || [];
    list.push(docItem);
    byCollection.set(docItem.collection, list);
  }

  // 3. Skriv dokumenter med batched writes til Firestore
  for (const [collectionName, documents] of byCollection) {
    try {
      for (const piece of chunk(documents, BATCH_SIZE)) {
        const batch = writeBatch(db);
        for (const item of piece) {
          if (collectionName === COLLECTIONS.VOLUNTEER_ROLES) {
            batch.set(
              doc(db, CMS_COLLECTIONS.SETTINGS, item.id),
              sanitizeForFirestore(volunteerRoleFields(item.data as VolunteerRole))
            );
          } else {
            batch.set(doc(db, collectionName, item.id), sanitizeForFirestore(item.data));
          }
        }
        await batch.commit();
      }
      result.counts[collectionName] = documents.length;
      result.total += documents.length;
    } catch (error) {
      recordFailure(result, collectionName, error);
    }
  }

  result.durationMs = Date.now() - startTime;
  result.success = result.failures.length === 0;
  return result;
}

/**
 * Genererer nøyaktig 32 testpersoner med varierende tilhørighet og roller i Firestore.
 * Dekker administrasjon, pastorer, stab, lovsangsledelse, teknisk team og husfellesskap.
 */
export async function generate32TestPersons(options?: {
  clearExisting?: boolean;
  groupCount?: number;
  roleCount?: number;
}): Promise<TestdataServiceResult> {
  return generateTestdata({
    personCount: 32,
    groupCount: options?.groupCount ?? 14,
    roleCount: options?.roleCount ?? 14,
    clearExisting: options?.clearExisting ?? true,
  });
}

/**
 * Tømmer alle planlegger-samlinger (personer, grupper, samlinger, oppgaver,
 * tildelinger, gruppemeldinger og oppmøte). Bevarer CMS-sider, artikler, taler og innstillinger.
 */
export async function clearPlannerTestData(): Promise<TestdataServiceResult> {
  return clearTestdata();
}

/**
 * Bakoverkompatibel alias for å skrive et tilpasset testsett til Firestore.
 */
export async function populateCustomMockData(
  counts?: CustomMockCounts,
  options?: { clearPlannerFirst?: boolean }
): Promise<TestdataServiceResult> {
  return generateTestdata({
    ...counts,
    clearExisting: options?.clearPlannerFirst,
  });
}

