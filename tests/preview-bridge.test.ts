import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import {
  acceptIframeMessage,
  acceptParentMessage,
  applyWarmDraft,
  buildEmbeddedPreviewUrl,
  extractWarmDraft,
  parseBridgeMessage,
  previewSearchFor,
  pathsMatchDraft,
} from "../src/utils/previewBridge";

describe("previewBridge", () => {
  test("extractWarmDraft excludes cold blobs", () => {
    const largeContent = "x".repeat(5000);
    const largeImage = "data:image/jpeg;base64," + "A".repeat(200_000);
    const warm = extractWarmDraft({
      id: "p1",
      title: "Tittel",
      content: largeContent,
      heroImage: largeImage,
      blocks: [{ id: "b1", type: "text", title: "T", isDynamic: false, rawContent: "hi" }],
    });
    expect(warm.title).toBe("Tittel");
    expect(warm).not.toHaveProperty("content");
    expect(warm).not.toHaveProperty("heroImage");
    expect(warm).not.toHaveProperty("blocks");
    expect(JSON.stringify(warm).length).toBeLessThan(500);
  });

  test("parseBridgeMessage rejects cold fields in cms:draft", () => {
    const msg = parseBridgeMessage({
      type: "cms:draft",
      pageId: "p1",
      revision: 1,
      draft: { title: "Ok", content: "secret" },
    });
    expect(msg).toBeNull();
  });

  test("acceptParentMessage rejects wrong source and origin", () => {
    const iframe = { postMessage: () => {} } as unknown as Window;
    const valid = acceptParentMessage(
      {
        origin: "http://localhost:3000",
        source: iframe,
        data: { type: "preview:location", path: "/om-oss", hash: "" },
      },
      "http://localhost:3000",
      iframe
    );
    expect(valid?.type).toBe("preview:location");

    expect(
      acceptParentMessage(
        {
          origin: "http://evil.test",
          source: iframe,
          data: { type: "preview:location", path: "/om-oss", hash: "" },
        },
        "http://localhost:3000",
        iframe
      )
    ).toBeNull();

    expect(
      acceptParentMessage(
        {
          origin: "http://localhost:3000",
          source: {} as Window,
          data: { type: "preview:location", path: "/om-oss", hash: "" },
        },
        "http://localhost:3000",
        iframe
      )
    ).toBeNull();
  });

  test("acceptIframeMessage rejects preview messages from parent", () => {
    const parent = { postMessage: () => {} } as unknown as Window;
    expect(
      acceptIframeMessage(
        {
          origin: "http://localhost:3000",
          source: parent,
          data: { type: "preview:ready", path: "/", hash: "", revision: 0 },
        },
        "http://localhost:3000",
        parent
      )
    ).toBeNull();
  });

  test("previewSearchFor keeps embedded flag", () => {
    expect(previewSearchFor({ preview: true, embedded: true })).toBe(
      "?preview=true&embedded=1"
    );
    expect(previewSearchFor({ preview: true, embedded: false })).toBe("?preview=true");
  });

  test("buildEmbeddedPreviewUrl includes preview params", () => {
    expect(buildEmbeddedPreviewUrl("/om-oss")).toBe("/om-oss?preview=true&embedded=1");
    expect(buildEmbeddedPreviewUrl("/")).toBe("/?preview=true&embedded=1");
  });

  test("pathsMatchDraft treats root paths equally", () => {
    expect(pathsMatchDraft("/", "/")).toBe(true);
    expect(pathsMatchDraft("/om-oss", "/om-oss")).toBe(true);
    expect(pathsMatchDraft("/om-oss", "/taler")).toBe(false);
  });

  test("applyWarmDraft merges without cold keys", () => {
    const merged = applyWarmDraft({ title: "Old" }, { title: "New", slug: "test" });
    expect(merged.title).toBe("New");
    expect(merged.slug).toBe("test");
  });

  test("firestore rules do not allow open read on cms_pages", () => {
    const rules = readFileSync(new URL("../firestore.rules", import.meta.url), "utf8");
    const cmsPagesBlock = rules.match(/match \/cms_pages\/\{pageId\} \{[\s\S]*?\}/)?.[0] || "";
    expect(cmsPagesBlock).not.toContain("allow read: if true");
    expect(cmsPagesBlock).toContain("isPublished == true");
    expect(cmsPagesBlock).toContain("isAdmin()");
  });
});
