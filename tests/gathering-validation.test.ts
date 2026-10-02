import { describe } from "vitest";
import { assert } from "./assert";
import { validateEvent, validateGathering, calculateAvailableSpots, ValidationError } from "../src/utils/validation";
import { initialGatherings } from "../src/data/mockData";

describe("Validering av samlinger", () => {
  // 1. Initial mock data validation test
  try {
    for (const g of initialGatherings) {
      validateGathering(g);
    }
    assert(true, "Alle standard mock-arrangementer i initialGatherings består streng validering");
  } catch (err) {
    assert(false, `Mock-arrangement feilet validering: ${err}`);
  }

  // 2. Missing title test
  try {
    const invalidNoTitle = {
      id: "event-no-title",
      groupId: "group-1",
      title: "",
      startsAt: "2026-10-15T11:00:00Z",
      visibility: "offentlig",
    };
    validateEvent(invalidNoTitle);
    assert(false, "Arrangement uten tittel skal kaste ValidationError");
  } catch (err) {
    const isValidationError = err instanceof ValidationError;
    const mentionsTitle = err instanceof Error && err.message.includes("tittel");
    assert(isValidationError && mentionsTitle, "Arrangement uten tittel kaster ValidationError med 'tittel'");
  }

  // 3. Missing date (startsAt) test
  try {
    const invalidNoDate = {
      id: "event-no-date",
      groupId: "group-1",
      title: "Gudstjeneste uten dato",
      startsAt: "",
      visibility: "offentlig",
    };
    validateEvent(invalidNoDate);
    assert(false, "Arrangement uten dato skal kaste ValidationError");
  } catch (err) {
    const isValidationError = err instanceof ValidationError;
    const mentionsDate = err instanceof Error && err.message.includes("dato");
    assert(isValidationError && mentionsDate, "Arrangement uten dato kaster ValidationError med 'dato'");
  }

  // 4. Invalid date format test
  try {
    const invalidDateFormat = {
      id: "event-bad-date",
      groupId: "group-1",
      title: "Ugyldig datoformat",
      startsAt: "not-a-date",
      visibility: "offentlig",
    };
    validateEvent(invalidDateFormat);
    assert(false, "Arrangement med ugyldig datoformat skal kaste ValidationError");
  } catch (err) {
    const isValidationError = err instanceof ValidationError;
    assert(isValidationError, "Arrangement med ugyldig datoformat kaster ValidationError");
  }

  // 5. Staffing equation: Ledige plasser = Behov − Bekreftet − Venter
  const test1 = calculateAvailableSpots(2, 1, 0); // Behov 2, Bekreftet 1, Venter 0 -> Ledig 1
  assert(test1 === 1, "Bemanningsligning: 2 behov - 1 bekreftet - 0 venter = 1 ledig plass");

  const test2 = calculateAvailableSpots(3, 1, 1); // Behov 3, Bekreftet 1, Venter 1 -> Ledig 1
  assert(test2 === 1, "Bemanningsligning: 3 behov - 1 bekreftet - 1 venter = 1 ledig plass");

  const test3 = calculateAvailableSpots(2, 2, 0); // Behov 2, Bekreftet 2, Venter 0 -> Ledig 0
  assert(test3 === 0, "Bemanningsligning: Fullt dekket (2 - 2 - 0 = 0 ledige)");

  const test4 = calculateAvailableSpots(1, 0, 1); // Behov 1, Bekreftet 0, Venter 1 -> Ledig 0
  assert(test4 === 0, "Bemanningsligning: 1 behov - 0 bekreftet - 1 venter = 0 ledige (venter på svar)");

  // 6. Test single source of visibility: only allowed values
  try {
    const invalidVisibility = {
      id: "event-bad-vis",
      groupId: "group-1",
      title: "Ugyldig synlighet",
      startsAt: "2026-10-15T11:00:00Z",
      visibility: "hemmelig",
    };
    validateEvent(invalidVisibility);
    assert(false, "Ugyldig visibility-verdi skal kaste ValidationError");
  } catch (err) {
    const isValidationError = err instanceof ValidationError;
    assert(isValidationError, "Ugyldig visibility-verdi kaster ValidationError");
  }
});
