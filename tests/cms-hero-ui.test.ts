import { describe, expect, test } from "vitest";
import { shortenHeading } from "../src/utils/cmsBlocks";
import { MAX_HERO_IMAGE_BYTES } from "../src/utils/imageUpload";

describe("shortenHeading", () => {
  test("beholder hele tittelen når den er kort nok", () => {
    expect(shortenHeading("Kalender: Hva skjer", 40)).toBe("Kalender: Hva skjer");
  });

  test("viser minst to hele ord før ellipsis", () => {
    expect(shortenHeading("Kalender: Hva skjer i menigheten", 16)).toBe("Kalender: Hva…");
    expect(shortenHeading("Neste gudstjeneste", 12)).toBe("Neste gudst…");
  });

  test("kutter ikke midt i et ord", () => {
    const shortened = shortenHeading("Kalender: Hva skjer", 18);
    expect(shortened.endsWith("…")).toBe(true);
    expect(shortened).not.toMatch(/Kale\.\.\./);
    expect(shortened.startsWith("Kalender:")).toBe(true);
  });
});

describe("Hero-bilde komprimering", () => {
  test("har en fornuftig maksstørrelse for Firestore", () => {
    expect(MAX_HERO_IMAGE_BYTES).toBe(200 * 1024);
  });
});
