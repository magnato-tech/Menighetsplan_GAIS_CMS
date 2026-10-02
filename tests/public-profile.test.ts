import { toPublicProfile, publicProfilesOf, publicProfileFields } from "../src/utils/publicProfile";
import { initialPersons, initialGroups } from "../src/data/mockData";
import type { Person } from "../src/types";

function runTests() {
  console.log("🧪 Starter tester for offentlig profil og samtykke...\n");
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

  const base: Person = {
    id: "p-1",
    name: "Kari Nordmann",
    phone: "912 34 567",
    email: "kari.privat@eksempel.no",
    globalRole: "member",
    policeCertificateValidUntil: "2028-01-01",
  };
  const consented: Person = {
    ...base,
    isPublicProfile: true,
    publicTitle: "Hovedpastor",
    publicPhone: "37 00 00 01",
    publicEmail: "pastor@eksempel.no",
    consentToPublishGivenAt: "2026-09-01T10:00:00.000Z",
    consentGivenBy: "admin-1",
  };

  // 1. Nobody is public without both the flag and a registered consent
  assert(toPublicProfile(base) === null, "Person uten offentlig profil vises ikke");
  assert(
    toPublicProfile({ ...base, isPublicProfile: true }) === null,
    "Flagget alene er ikke nok: uten registrert samtykke vises personen ikke"
  );
  assert(
    toPublicProfile({ ...consented, isPublicProfile: false }) === null,
    "Samtykke alene er ikke nok: når flagget er av vises personen ikke"
  );

  // 2. The public profile carries the public fields and nothing private
  const profile = toPublicProfile(consented);
  assert(profile !== null && profile.name === "Kari Nordmann" && profile.title === "Hovedpastor", "Offentlig profil har navn og tittel utad");
  assert(profile?.phone === "37 00 00 01" && profile?.email === "pastor@eksempel.no", "Offentlig profil bruker telefon og e-post utad");
  const published = JSON.stringify(profile);
  assert(
    !published.includes("912 34 567") && !published.includes("kari.privat@eksempel.no") && !published.includes("2028-01-01"),
    "Privat telefon, privat e-post og politiattest er ikke med i den offentlige profilen"
  );
  const nameOnly = toPublicProfile({ ...consented, publicPhone: undefined, publicEmail: "" });
  assert(
    nameOnly !== null && nameOnly.phone === undefined && nameOnly.email === undefined,
    "Uten kontaktinfo utad vises bare navnet; privat kontaktinfo brukes aldri som reserve"
  );

  // 3. Picking the public profiles of a group
  const other: Person = { ...consented, id: "p-2", name: "Ola Hansen" };
  const hidden: Person = { ...base, id: "p-3", name: "Ingrid Berg" };
  const list = publicProfilesOf(["p-3", "p-2", "finnes-ikke", "p-1"], [consented, other, hidden]);
  assert(list.map((p) => p.id).join() === "p-2,p-1", "publicProfilesOf beholder rekkefølgen og hopper over dem uten samtykke");
  assert(publicProfilesOf([], [consented]).length === 0, "Ingen id-er gir ingen profiler");

  // 4. Saving from the admin form
  const now = new Date("2026-10-02T08:00:00.000Z");
  const turnedOn = publicProfileFields(base, { isPublic: true, title: " Hovedpastor ", phone: "", email: " pastor@eksempel.no " }, "admin-7", now);
  assert(turnedOn.isPublicProfile === true, "Å krysse av slår på den offentlige profilen");
  assert(
    turnedOn.consentToPublishGivenAt === "2026-10-02T08:00:00.000Z" && turnedOn.consentGivenBy === "admin-7",
    "Første gang registreres tidspunkt og hvem som registrerte samtykket"
  );
  assert(turnedOn.publicTitle === "Hovedpastor" && turnedOn.publicEmail === "pastor@eksempel.no", "Tittel og e-post utad trimmes");
  assert(turnedOn.publicPhone === undefined, "Tomt felt utad lagres som tomt");
  assert(toPublicProfile({ ...base, ...turnedOn }) !== null, "Personen vises offentlig etter lagring");

  const savedAgain = publicProfileFields(consented, { isPublic: true, title: "Pastor", phone: "37 00 00 01", email: "pastor@eksempel.no" }, "admin-9", now);
  assert(
    savedAgain.consentToPublishGivenAt === "2026-09-01T10:00:00.000Z" && savedAgain.consentGivenBy === "admin-1",
    "Et samtykke som allerede er registrert beholder sitt opprinnelige tidspunkt og sin registrator"
  );
  assert(savedAgain.publicTitle === "Pastor", "Tittelen utad kan endres uten nytt samtykke");

  const turnedOff = publicProfileFields(consented, { isPublic: false, title: "Hovedpastor", phone: "", email: "" }, "admin-9", now);
  assert(turnedOff.isPublicProfile === false, "Å fjerne krysset slår av den offentlige profilen");
  assert(
    turnedOff.consentToPublishGivenAt === undefined && turnedOff.consentGivenBy === undefined,
    "Når samtykket trekkes fjernes registreringen"
  );
  assert(toPublicProfile({ ...consented, ...turnedOff }) === null, "Personen vises ikke lenger etter at samtykket er trukket");

  const turnedOnAgain = publicProfileFields({ ...consented, ...turnedOff }, { isPublic: true, title: "", phone: "", email: "" }, "admin-9", now);
  assert(
    turnedOnAgain.consentToPublishGivenAt === "2026-10-02T08:00:00.000Z" && turnedOnAgain.consentGivenBy === "admin-9",
    "Å slå på igjen etter et trukket samtykke registrerer et nytt samtykke"
  );

  // 5. The demo data shows both cases
  const demoProfiles = initialPersons.map(toPublicProfile);
  assert(demoProfiles.some((p) => p !== null) && demoProfiles.some((p) => p === null), "Demodataene har både personer med og uten offentlig profil");
  const demoPublished = JSON.stringify(demoProfiles);
  assert(
    initialPersons.every((p) => (!p.phone || !demoPublished.includes(p.phone)) && (!p.email || !demoPublished.includes(p.email))),
    "Ingen privat telefon eller e-post fra demodataene havner i de offentlige profilene"
  );
  const leaderGroups = initialGroups.filter((g) => g.category === "ledergruppe");
  assert(
    leaderGroups.length > 0 &&
      leaderGroups.every((g) => publicProfilesOf([...g.leaderIds, ...g.memberIds], initialPersons).length > 0),
    "Hver ledergruppe i demodataene har minst én person å vise"
  );

  console.log(`\nResultat: ${passed} bestått, ${failed} feilet.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
