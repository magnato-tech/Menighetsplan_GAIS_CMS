import { describe } from "vitest";
import { assert } from "./assert";
import {
  MISSING,
  chartTicks,
  describeChange,
  formatDayMonth,
  formatDaysAgo,
  formatHours,
  formatPercent,
} from "../src/utils/analyticsFormat";

describe("Tallene på analysebordet", () => {
  assert(formatPercent(0.8) === "80 %" && formatPercent(null) === MISSING, "Prosent skrives med mellomrom, manglende som strek");
  assert(formatHours(0.5) === "under 1 time" && formatHours(1) === "1 time" && formatHours(4.4) === "4 timer", "Korte svartider i timer");
  assert(formatHours(72) === "3 døgn" && formatHours(null) === MISSING, "Lange svartider i døgn");

  const up = describeChange(90, 75);
  assert(up?.direction === "up" && up.text === "+15", "En økning vises med pluss");
  const down = describeChange(0.6, 0.8, "rate");
  assert(down?.direction === "down" && down.text === "−20 prosentpoeng", "Andeler sammenlignes i prosentpoeng");
  assert(describeChange(5, 5)?.text === "Uendret", "Likt er uendret");
  assert(describeChange(90, null) === null && describeChange(null, 3) === null, "Uten tall å sammenligne med vises ingen endring");

  assert(formatDayMonth("2026-09-13T09:00:00.000Z") === "13.9.", "Søylene merkes med dag og måned");
  const now = new Date(2026, 9, 5, 12).getTime();
  assert(formatDaysAgo(new Date(2026, 9, 5, 8).toISOString(), now) === "i dag", "Samme dag er i dag");
  assert(formatDaysAgo(new Date(2026, 9, 4, 23).toISOString(), now) === "i går", "Dagen før er i går");
  assert(formatDaysAgo(new Date(2026, 8, 23, 12).toISOString(), now) === "for 12 dager siden", "Eldre i dager");
  assert(formatDaysAgo(null, now) === "aldri", "Ingen aktivitet er aldri");
});

describe("Aksene på analysebordet", () => {
  assert(chartTicks(0).join(",") === "0", "Uten tall er aksen bare null");
  assert(chartTicks(123).join(",") === "0,25,50,75,100,125", "123 gir runde steg på 25 til over største verdi");
  assert(chartTicks(100).join(",") === "0,20,40,60,80,100", "100 gir steg på 20 og slutter på 100");
  assert(chartTicks(7).join(",") === "0,2,4,6,8", "Små tall gir små, hele steg");
  assert(chartTicks(1).join(",") === "0,1", "Ett besøk gir ikke kvarte besøk på aksen");
  assert(chartTicks(2).join(",") === "0,1,2", "To gir hele steg, ikke halve");
  assert(chartTicks(12).join(",") === "0,5,10,15", "Tolv gir steg på fem, ikke på to og en halv");
  assert(chartTicks(980).every((t, i, all) => i === 0 || t > all[i - 1]) && chartTicks(980).length <= 6, "Aldri flere enn seks merker, stigende");
});
