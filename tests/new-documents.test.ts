import { newId } from "../src/utils/id";
import {
  buildPerson,
  buildGroup,
  buildGathering,
  buildTask,
  buildAssignment,
  buildGroupMessage,
} from "../src/data/newDocuments";
import { validateGathering } from "../src/utils/validation";

function runTests() {
  console.log("🧪 Starter tester for opprettelse av nye dokumenter...\n");
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

  // 1. Ids made in the same millisecond must differ, or Firestore overwrites one document with the next
  const ids = Array.from({ length: 500 }, () => newId("task"));
  assert(new Set(ids).size === ids.length, "500 ID-er laget i en løkke er alle unike");
  assert(ids.every((id) => id.startsWith("task-")), "ID-en beholder prefikset");

  // 2. Cloning tasks in a loop: every task keeps its own id
  const cloned = ["Lyd", "Bilde", "Møteleder", "Kirkekaffe", "Vert"].map((title) =>
    buildTask({ gatheringId: "gathering-1", groupId: "group-1", title })
  );
  assert(new Set(cloned.map((t) => t.id)).size === cloned.length, "Fem oppgaver klonet i en løkke får fem ulike ID-er");

  // 3. Task defaults
  const task = buildTask({ gatheringId: "gathering-1", groupId: "group-1", title: "  Lyd  " });
  assert(task.title === "Lyd", "Oppgavetittel trimmes");
  assert(task.status === "open" && task.neededCount === 1, "Ny oppgave er åpen og trenger én person");

  // 4. Gatherings: `visibility` decides, `isPublic` only mirrors it
  const arrangement = buildGathering({ title: "Gudstjeneste", startsAt: "2026-10-18T11:00:00" });
  assert(arrangement.visibility === "offentlig" && arrangement.isPublic === true, "Arrangement er offentlig som standard");
  const groupGathering = buildGathering({ title: "Husfellesskap", startsAt: "2026-10-20T19:00:00", type: "gruppesamling" });
  assert(groupGathering.visibility === "intern" && groupGathering.isPublic === false, "Gruppesamling er intern som standard");
  const mismatched = buildGathering({
    title: "Lederforum",
    startsAt: "2026-10-21T19:00:00",
    visibility: "intern",
    isPublic: true,
  });
  assert(mismatched.isPublic === false, "isPublic følger visibility også når de to er oppgitt ulikt");
  const featured = buildGathering({ title: "Julekonsert", startsAt: "2026-12-14T18:00:00", visibility: "fremhevet" });
  assert(featured.isPublic === true, "Fremhevet samling er offentlig");
  try {
    validateGathering(arrangement);
    assert(true, "Ny samling består valideringen");
  } catch (err) {
    assert(false, `Ny samling feilet valideringen: ${err}`);
  }

  // 5. Persons and groups
  const person = buildPerson({ name: " Kari Nordmann ", phone: " 900 00 000 " });
  assert(person.name === "Kari Nordmann" && person.phone === "900 00 000", "Navn og telefon trimmes");
  assert(person.globalRole === "member" && person.email === "", "Ny person er vanlig medlem med tom e-post");
  const group = buildGroup({ name: "Lyd og bilde" });
  assert(group.category === "tjenestegruppe" && group.isPublic === true, "Ny gruppe er offentlig tjenestegruppe som standard");
  assert(
    group.memberIds.length === 0 && group.leaderIds.length === 0 && group.deputyLeaderIds?.length === 0,
    "Ny gruppe starter uten medlemmer og ledere"
  );

  // 6. Assignments and messages
  const first = buildAssignment("task-1", "person-1", "pending");
  const second = buildAssignment("task-1", "person-1", "pending");
  assert(first.id !== second.id, "To tildelinger av samme oppgave til samme person får ulike ID-er");
  assert(first.taskId === "task-1" && first.personId === "person-1" && first.response === "pending", "Tildelingen peker på oppgaven og personen");
  const message = buildGroupMessage("group-1", { id: "person-1", name: "Kari Nordmann" }, "  Hei!  ");
  assert(
    message.senderPersonId === "person-1" && message.senderName === "Kari Nordmann" && message.content === "Hei!",
    "Meldingen får avsender og trimmet innhold"
  );
  assert(!isNaN(Date.parse(message.createdAt)), "Meldingen får et gyldig tidspunkt");

  console.log(`\nResultat: ${passed} bestått, ${failed} feilet.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
