import { deleteField } from "firebase/firestore";
import { sanitizeForFirestore, forUpdate } from "../src/utils/firestoreData";

function runTests() {
  console.log("🧪 Starter tester for klargjøring av data til Firestore...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  const isDelete = (value: unknown) => deleteField().isEqual(value as ReturnType<typeof deleteField>);

  // 1. New documents: undefined is dropped at every level, everything else is kept as it is
  const cleaned = sanitizeForFirestore({
    name: "Kari",
    phone: undefined,
    tags: ["a", undefined, "b"],
    schedule: { weekday: "Onsdag", time: undefined },
    count: 0,
    note: "",
    flag: false,
    nothing: null,
  });
  assert(!("phone" in cleaned), "sanitizeForFirestore fjerner felt som er undefined");
  assert(!("time" in cleaned.schedule), "sanitizeForFirestore fjerner undefined i nestede objekter");
  assert(cleaned.schedule.weekday === "Onsdag", "Nestede felt med verdi beholdes");
  assert(cleaned.count === 0 && cleaned.note === "" && cleaned.flag === false, "0, tom tekst og false beholdes");
  assert(cleaned.nothing === null, "null beholdes");
  assert(sanitizeForFirestore(undefined) === undefined && sanitizeForFirestore(null) === null, "undefined og null alene går uendret gjennom");

  // 2. Updates: a field set to undefined must be cleared, not left with its old value
  const update = forUpdate({
    name: "Kari Nordmann",
    phone: undefined,
    policeCertificateValidUntil: undefined,
    unavailablePeriods: [{ from: "2026-07-01", to: "2026-07-14", reason: undefined }],
    neededCount: 0,
  });
  assert(update.name === "Kari Nordmann", "forUpdate beholder felt med verdi");
  assert(isDelete(update.phone), "forUpdate sletter et felt som er satt til undefined");
  assert(isDelete(update.policeCertificateValidUntil), "forUpdate sletter hvert felt som er undefined");
  assert(update.neededCount === 0, "forUpdate beholder 0");
  const periods = update.unavailablePeriods as Record<string, unknown>[];
  assert(
    periods.length === 1 && periods[0].from === "2026-07-01" && !("reason" in periods[0]),
    "forUpdate fjerner undefined inne i nestede verdier"
  );
  assert(Object.keys(forUpdate({})).length === 0, "forUpdate av en tom oppdatering er tom");
  assert(!("email" in forUpdate({ name: "Ola" })), "Et felt som ikke er nevnt i oppdateringen røres ikke");

  console.log(`\nResultat: ${passed} bestått, ${failed} feilet.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
