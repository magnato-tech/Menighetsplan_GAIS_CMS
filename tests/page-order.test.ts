import { describe } from "vitest";
import { assert } from "./assert";
import { dropPositionAt, moveInList, stepInList } from "../src/utils/pageOrder";

const ids = ["a", "b", "c", "d"];
const j = (x: string[] | null) => (x === null ? "null" : x.join(""));

describe("Rekkefølge på sider: flytte ett punkt", () => {
  assert(j(moveInList(ids, "a", "c", "after")) === "bcad", "Flyttes etter et punkt lenger ned");
  assert(j(moveInList(ids, "a", "c", "before")) === "bacd", "Flyttes foran et punkt lenger ned");
  assert(j(moveInList(ids, "d", "a", "before")) === "dabc", "Flyttes helt først");
  assert(j(moveInList(ids, "a", "d", "after")) === "bcda", "Flyttes helt sist");
  assert(j(moveInList(ids, "b", "b", "after")) === "abcd", "Å flytte noe til seg selv endrer ingenting");
  assert(moveInList(ids, "a", "finnes-ikke", "after") === ids, "Et mål som ikke finnes gir listen tilbake som den var");
  assert(j(moveInList(ids, "x", "b", "after")) === "abxcd", "Et punkt som ikke var i listen settes inn");
  assert(ids.join("") === "abcd", "Listen som sendes inn endres ikke");
});

describe("Rekkefølge på sider: ett steg opp eller ned", () => {
  assert(j(stepInList(ids, "b", "up")) === "abcd".replace("ab", "ba"), "Opp bytter plass med den over");
  assert(j(stepInList(ids, "b", "down")) === "acbd", "Ned bytter plass med den under");
  assert(stepInList(ids, "a", "up") === null, "Øverste kan ikke opp");
  assert(stepInList(ids, "d", "down") === null, "Nederste kan ikke ned");
  assert(stepInList(ids, "x", "up") === null, "Et punkt som ikke finnes, flyttes ikke");
  assert(stepInList(["a"], "a", "down") === null && stepInList(["a"], "a", "up") === null, "Én side kan ikke flyttes");
  assert(ids.join("") === "abcd", "Listen som sendes inn endres ikke");
});

describe("Rekkefølge på sider: hvor slippet lander", () => {
  const row = { top: 100, height: 100 };
  assert(dropPositionAt(120, row) === "before", "Øvre halvdel gir foran");
  assert(dropPositionAt(180, row) === "after", "Nedre halvdel gir etter");
  assert(dropPositionAt(150, row) === "after", "Akkurat på midten regnes som nedre halvdel");
  assert(dropPositionAt(149.9, row) === "before", "Rett over midten er øvre halvdel");
  assert(dropPositionAt(10, row) === "before" && dropPositionAt(500, row) === "after", "Utenfor raden går til nærmeste side");
});
