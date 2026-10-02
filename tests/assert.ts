import { expect, test } from "vitest";

/**
 * Registers one named check. The condition is worked out while the file is being
 * collected, so a test file reads top to bottom like a script and still reports
 * every check by name.
 */
export function assert(condition: boolean, testName: string): void {
  test(testName, () => {
    expect(condition).toBe(true);
  });
}
