import { describe } from "vitest";
import { assert } from "./assert";
import {
  combineDateAndTimeToIso,
  parseIsoToDateAndTime,
  formatNorwegianDateTime,
  formatCompactGatheringSubtitle,
  formatChatMessageTime,
  monthKeyOf,
  monthOptionsOf,
} from "../src/utils/dates";

describe("Datoer og klokkeslett", () => {
  // The helpers work in the time zone of whoever runs them, so the checks go through
  // combineDateAndTimeToIso rather than assume which zone the test machine is in.
  const sundayMorning = combineDateAndTimeToIso("2026-11-01", "11:00");

  // 1. From a form's date and clock time to a stored moment, and back
  assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(sundayMorning), "Dato og klokkeslett lagres som et eksakt tidspunkt");
  const backAgain = parseIsoToDateAndTime(sundayMorning);
  assert(backAgain.date === "2026-11-01" && backAgain.time === "11:00", "Tidspunktet leses tilbake som samme dato og klokkeslett");
  const offsetForm = parseIsoToDateAndTime(new Date(sundayMorning).toISOString().replace("Z", "+00:00"));
  assert(offsetForm.date === "2026-11-01" && offsetForm.time === "11:00", "Et tidspunkt skrevet med tidssoneforskyvning leses likt");
  assert(parseIsoToDateAndTime(combineDateAndTimeToIso("2026-11-01", "")).time === "11:00", "Uten klokkeslett brukes 11:00");
  assert(parseIsoToDateAndTime(combineDateAndTimeToIso("2026-12-31", "23:45")).date === "2026-12-31", "Sent på kvelden er fortsatt samme dato");
  const invalid = parseIsoToDateAndTime("ikke en dato");
  assert(invalid.date === "" && invalid.time === "11:00", "En ugyldig verdi gir tom dato");

  // 2. How a moment reads
  assert(formatNorwegianDateTime(sundayMorning) === "Søndag 1. nov. kl. 11:00", "Kort form: ukedag, dato og klokkeslett");
  assert(
    formatNorwegianDateTime(combineDateAndTimeToIso("2026-05-17", "09:05")) === "Søndag 17. mai kl. 09:05",
    "Klokkeslett skrives med to sifre"
  );
  assert(formatNorwegianDateTime("ikke en dato") === "ikke en dato", "En ugyldig verdi vises som den er");
  assert(
    formatCompactGatheringSubtitle(sundayMorning, "Hovedsalen", "Gudstjeneste") === "søndag 1. november 2026 · 11:00 · Hovedsalen · Gudstjeneste",
    "Lang form med sted og type"
  );
  assert(formatCompactGatheringSubtitle(sundayMorning) === "søndag 1. november 2026 · 11:00", "Lang form uten sted og type");

  // 3. Chat messages: today and yesterday by name, older ones by date
  const at = (daysAgo: number, time: string) => {
    const day = new Date();
    day.setDate(day.getDate() - daysAgo);
    const date = parseIsoToDateAndTime(day.toISOString()).date;
    return combineDateAndTimeToIso(date, time);
  };
  assert(formatChatMessageTime(at(0, "08:15")) === "I dag kl. 08:15", "En melding fra i dag");
  assert(formatChatMessageTime(at(1, "21:40")) === "I går kl. 21:40", "En melding fra i går");
  assert(/^\d{1,2}\. \S+ kl\. 12:00$/.test(formatChatMessageTime(at(10, "12:00"))), "En eldre melding vises med dato");

  // 4. The months a list of moments covers, for a month filter
  const moments = [
    combineDateAndTimeToIso("2026-11-15", "11:00"),
    combineDateAndTimeToIso("2026-10-11", "11:00"),
    combineDateAndTimeToIso("2027-01-10", "11:00"),
    combineDateAndTimeToIso("2026-10-25", "19:00"),
    "ikke en dato",
  ];
  const options = monthOptionsOf(moments);
  assert(options.map((o) => o.id).join() === "2026-10,2026-11,2027-01", "Hver måned én gang, i rekkefølge, og uten ugyldige datoer");
  assert(options.map((o) => o.label).join() === "Okt 2026,Nov 2026,Jan 2027", "Månedene heter «Okt 2026»");
  assert(monthOptionsOf([]).length === 0, "Uten datoer er det ingen måneder å velge");
  assert(
    monthKeyOf(combineDateAndTimeToIso("2026-11-01", "00:30")) === "2026-11",
    "En samling like etter midnatt hører til måneden den har for den som ser på, ikke måneden i UTC"
  );
  assert(monthKeyOf("ikke en dato") === "", "En ugyldig dato har ingen måned");
});
