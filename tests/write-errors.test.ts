import {
  reportWriteError,
  clearWriteError,
  getWriteError,
  subscribeToWriteError,
} from "../src/services/writeErrors";

function runTests() {
  console.log("🧪 Starter tester for melding av mislykkede skrivinger...\n");
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

  // reportWriteError logs to the console by design; keep the test output readable
  const originalConsoleError = console.error;
  console.error = () => {};

  assert(getWriteError() === null, "Ingen feil er meldt ved oppstart");

  let notifications = 0;
  const unsubscribe = subscribeToWriteError(() => notifications++);

  reportWriteError("lagre samlingen", new Error("Missing or insufficient permissions."));
  assert(getWriteError()?.action === "lagre samlingen", "Feilen sier hva brukeren prøvde å gjøre");
  assert(getWriteError()?.detail === "Missing or insufficient permissions.", "Feilen tar med meldingen fra Firestore");
  assert(notifications === 1, "Lyttere varsles når en feil meldes");

  // The service functions hand back the error as a plain string
  reportWriteError("slette oppgaven", "Gruppe ble ikke funnet");
  assert(getWriteError()?.detail === "Gruppe ble ikke funnet", "En feil gitt som tekst vises uendret");
  assert(getWriteError()?.action === "slette oppgaven", "Den nyeste feilen erstatter den forrige");

  reportWriteError("lagre siden", undefined);
  assert(getWriteError()?.detail === "Ukjent feil", "En feil uten innhold får en lesbar tekst");

  clearWriteError();
  assert(getWriteError() === null, "Feilen kan lukkes");
  assert(notifications === 4, "Lyttere varsles også når feilen lukkes");

  unsubscribe();
  reportWriteError("lagre gruppen", "x");
  assert(notifications === 4, "En avmeldt lytter varsles ikke lenger");
  clearWriteError();

  console.error = originalConsoleError;

  console.log(`\nResultat: ${passed} bestått, ${failed} feilet.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
