import { beforeEach, describe, expect, test } from "vitest";
import { MAX_SECONDS_PER_VIEW, VisitTracker, type TrafficRecorder } from "../src/utils/visitTracker";

// What the tracker hands on, written down in order: "view /om-oss entry", "seconds /om-oss 12 first"
let recorded: string[] = [];
const recorder: TrafficRecorder = {
  view: (address, _at, visit) => recorded.push(["view", address, visit.entry ? "entry" : "", visit.second ? "second" : ""].filter(Boolean).join(" ")),
  seconds: (address, _at, seconds, first) => recorded.push(["seconds", address, seconds, first ? "first" : ""].filter(Boolean).join(" ")),
  missing: (address) => recorded.push(`missing ${address}`),
};
const page = (address: string) => ({ kind: "page" as const, address });
const missing = (address: string) => ({ kind: "missing" as const, address });
const SECOND = 1000;

beforeEach(() => {
  recorded = [];
});

describe("Et besøk, side for side", () => {
  test("den første siden er der besøket starter, og den andre gjør det til mer enn én side", () => {
    const tracker = new VisitTracker(recorder);
    tracker.show(page("/"), 0);
    tracker.show(page("/om-oss"), 500);
    tracker.show(page("/kontakt"), 900);

    expect(recorded).toEqual(["view / entry", "view /om-oss second", "view /kontakt"]);
  });

  test("samme side vist på nytt uten noe imellom er samme visning", () => {
    const tracker = new VisitTracker(recorder);
    tracker.show(page("/"), 0);
    tracker.show(page("/"), 100);
    tracker.show(page("/"), 200);
    expect(recorded).toEqual(["view / entry"]);

    // Going away and coming back is a new view
    tracker.show(page("/om-oss"), 300);
    tracker.show(page("/"), 400);
    expect(recorded).toEqual(["view / entry", "view /om-oss second", "view /"]);
  });

  test("en adresse uten side telles for seg, og starter ikke besøket", () => {
    const tracker = new VisitTracker(recorder);
    tracker.show(missing("/gammel-lenke"), 0);
    tracker.show(missing("/gammel-lenke"), 50);
    tracker.show(page("/"), 100);

    expect(recorded).toEqual(["missing /gammel-lenke", "view / entry"]);
  });

  test("forlater den besøkende nettsiden for Min side og kommer tilbake, er det samme besøk", () => {
    const tracker = new VisitTracker(recorder);
    tracker.show(page("/"), 0);
    tracker.show(null, 12 * SECOND);
    tracker.show(null, 13 * SECOND);
    tracker.show(page("/"), 60 * SECOND);

    // The time on the front page is sent when it is left, and the front page is a new view, not a new visit
    expect(recorded).toEqual(["view / entry", "seconds / 12 first", "view / second"]);
  });
});

describe("Tiden en side er framme", () => {
  test("hele sekunder sendes, og bare de som ikke er sendt før", () => {
    const tracker = new VisitTracker(recorder);
    tracker.show(page("/"), 0);
    tracker.flush(900);
    expect(recorded).toEqual(["view / entry"]);

    tracker.flush(10_400);
    tracker.flush(10_900);
    tracker.flush(31_000);
    expect(recorded).toEqual(["view / entry", "seconds / 10 first", "seconds / 21"]);
  });

  test("tiden på siden som forlates, sendes når neste side vises", () => {
    const tracker = new VisitTracker(recorder);
    tracker.show(page("/"), 0);
    tracker.show(page("/om-oss"), 7 * SECOND);
    tracker.flush(11 * SECOND);

    expect(recorded).toEqual(["view / entry", "seconds / 7 first", "view /om-oss second", "seconds /om-oss 4 first"]);
  });

  test("tid teller bare mens siden er synlig", () => {
    const tracker = new VisitTracker(recorder);
    tracker.show(page("/"), 0);
    tracker.setVisible(false, 5 * SECOND);
    // An hour in a tab nobody looks at
    tracker.flush(3605 * SECOND);
    tracker.setVisible(true, 3605 * SECOND);
    tracker.flush(3608 * SECOND);

    expect(recorded).toEqual(["view / entry", "seconds / 5 first", "seconds / 3"]);
  });

  test("en side som åpnes i en fane som ikke er framme, får ingen tid før den vises", () => {
    const tracker = new VisitTracker(recorder, false);
    tracker.show(page("/"), 0);
    tracker.flush(40 * SECOND);
    expect(recorded).toEqual(["view / entry"]);
    expect(tracker.nextFlushInMs(40 * SECOND)).toBeNull();

    tracker.setVisible(true, 40 * SECOND);
    tracker.flush(46 * SECOND);
    expect(recorded).toEqual(["view / entry", "seconds / 6 first"]);
  });

  test("en side som blir stående framme, teller høyst en halv time", () => {
    const tracker = new VisitTracker(recorder);
    tracker.show(page("/"), 0);
    tracker.flush(5 * 3600 * SECOND);
    tracker.flush(6 * 3600 * SECOND);

    expect(recorded).toEqual(["view / entry", `seconds / ${MAX_SECONDS_PER_VIEW} first`]);
    expect(tracker.nextFlushInMs(6 * 3600 * SECOND)).toBeNull();
  });

  test("det sendes tidlig for korte besøk, og så en gang i minuttet", () => {
    const tracker = new VisitTracker(recorder);
    expect(tracker.nextFlushInMs(0)).toBeNull();

    tracker.show(page("/"), 0);
    expect(tracker.nextFlushInMs(0)).toBe(10 * SECOND);
    expect(tracker.nextFlushInMs(4 * SECOND)).toBe(6 * SECOND);
    expect(tracker.nextFlushInMs(10 * SECOND)).toBe(20 * SECOND);
    expect(tracker.nextFlushInMs(30 * SECOND)).toBe(30 * SECOND);
    expect(tracker.nextFlushInMs(60 * SECOND)).toBe(60 * SECOND);
    expect(tracker.nextFlushInMs(150 * SECOND)).toBe(30 * SECOND);
    // Never so soon that the clock is asked again at once
    expect(tracker.nextFlushInMs(9_990)).toBe(250);

    tracker.setVisible(false, 200 * SECOND);
    expect(tracker.nextFlushInMs(200 * SECOND)).toBeNull();
  });
});
