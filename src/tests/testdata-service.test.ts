import { describe, expect, test, vi, beforeEach } from "vitest";
import {
  generateTestdata,
  clearTestdata,
  clearPlannerTestData,
} from "../services/testdataService";
import { COLLECTIONS, CMS_COLLECTIONS } from "../data/collections";

// Mock firebase/firestore
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual<any>("firebase/firestore");
  return {
    ...actual,
    collection: vi.fn((_db, name) => ({ id: name, path: name })),
    doc: vi.fn((_db, coll, id) => ({ id, path: `${coll}/${id}` })),
    getDocs: vi.fn(async (collRef) => {
      // Returner 2 mock-dokumenter per samling
      return {
        empty: false,
        size: 2,
        docs: [
          { id: `${collRef.id}-1`, ref: { path: `${collRef.id}/${collRef.id}-1` } },
          { id: `${collRef.id}-2`, ref: { path: `${collRef.id}/${collRef.id}-2` } },
        ],
      };
    }),
    writeBatch: vi.fn(() => ({
      set: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

describe("testdataService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("generateTestdata genererer testdata og skriver til Firestore med referanseintegritet", async () => {
    const result = await generateTestdata({
      personCount: 32,
      groupCount: 12,
      roleCount: 14,
      clearExisting: false,
    });

    expect(result.success).toBe(true);
    expect(result.counts[COLLECTIONS.PERSONS]).toBe(32);
    expect(result.counts[COLLECTIONS.GROUPS]).toBe(12);
    expect(result.failures).toHaveLength(0);
    expect(result.total).toBeGreaterThan(44);
  });

  test("clearTestdata sletter kun planlegger-samlinger og bevarer CMS-innhold", async () => {
    const result = await clearTestdata();

    expect(result.success).toBe(true);
    expect(result.failures).toHaveLength(0);

    // Verifiser at CMS-samlinger IKKE er berørt i slettingen
    const deletedCollections = Object.keys(result.counts);
    for (const cmsColl of Object.values(CMS_COLLECTIONS)) {
      expect(deletedCollections).not.toContain(cmsColl);
    }

    // Verifiser at planlegger-samlinger ble slettet
    expect(deletedCollections).toContain(COLLECTIONS.PERSONS);
    expect(deletedCollections).toContain(COLLECTIONS.GROUPS);
    expect(deletedCollections).toContain(COLLECTIONS.ASSIGNMENTS);
  });

  test("clearPlannerTestData fungerer som alias for total planleggertømming", async () => {
    const result = await clearPlannerTestData();
    expect(result.success).toBe(true);
    expect(result.counts[COLLECTIONS.PERSONS]).toBeDefined();
    expect(result.counts[COLLECTIONS.GROUPS]).toBeDefined();
  });
});
