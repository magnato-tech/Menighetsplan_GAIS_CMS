import { createHash } from "node:crypto";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi } from "vitest";

/**
 * Runs the page tree in the admin through fixed interactions and records what it reports and how it looks
 * after each step. The golden file holds the result from before the component was split up.
 */

const NOW = new Date("2026-10-07T12:00:00.000Z");
const page = (id: string, title: string, extra: Record<string, unknown> = {}) => ({
  id, slug: id, title, summary: "", content: "", isPublished: true, updatedAt: "2026-01-01T00:00:00.000Z", ...extra,
});
const a = page("a", "Om oss", { menuOrder: 1, summary: "Kort om menigheten", heroImage: "https://x/h.png" });
const a1 = page("a1", "Historie", { menuOrder: 1, parentPageId: "a" });
const a2 = page("a2", "Tro", { menuOrder: 2, parentPageId: "a", inNavMenu: false });
const a3 = page("a3", "Staben", { menuOrder: 3, parentPageId: "a", heroImage: "https://x/s.png" });
const b = page("b", "Grupper", { menuOrder: 2, isPublished: false });
const b1 = page("b1", "Husfellesskap", { menuOrder: 1, parentPageId: "b", publishAt: "2026-12-24T09:00:00.000Z" });
const c = page("c", "Hva skjer", { menuOrder: 3, linkUrl: "/hva-skjer", inNavMenu: false });
const orphan = page("o", "Uten forelder", { parentPageId: "finnes-ikke", isPublished: false });

const nodes = [
  { page: a, children: [a1, a2, a3] },
  { page: b, children: [b1] },
  { page: c, children: [] },
];

const norm = (html: string) =>
  html.replace(/class="([^"]*)"/g, (_m, c) => 'class="' + c.split(/\s+/).filter(Boolean).sort().join(" ") + '"');
const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

export async function runPageTree(root: string) {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  const mod: any = await import(/* @vite-ignore */ root + "/src/pages/admin/tabs/pages/PageTreeList.tsx");

  // jsdom has no layout; the middle of every row is at y = 150
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = () => ({ top: 100, height: 100, bottom: 200, left: 0, right: 0, width: 0, x: 0, y: 100, toJSON() {} }) as DOMRect;

  const calls: unknown[][] = [];
  const log = (name: string) => (...args: unknown[]) => void calls.push([name, ...args.map((x: any) => (x && typeof x === "object" && "id" in x ? x.id : x))]);
  const steps: { step: string; html: string; calls: number }[] = [];
  const api = render(
    <MemoryRouter>
      <mod.PageTreeList
        hierarchicalPages={nodes}
        orphanPages={[orphan]}
        onOpenNewPage={log("new")}
        onOpenEditPage={log("edit")}
        onRequestDelete={log("delete")}
        onReorder={log("reorder")}
        onPreviewPage={log("preview")}
        onTogglePublish={log("toggle")}
      />
    </MemoryRouter>
  );
  const q = api.container;
  const snap = (step: string) => steps.push({ step, html: hash(norm(q.innerHTML)), calls: calls.length });
  const dt = () => ({ dataTransfer: { setData() {}, effectAllowed: "", dropEffect: "" } });
  const rowOf = (text: string) => [...q.querySelectorAll("h3,h4")].find((h) => h.textContent === text)!;
  const topHandle = (text: string) => rowOf(text).closest("div.p-4")!.querySelector('[title^="Dra og slipp for å endre rekkefølge på toppmenyen"]')!;
  const subHandle = (text: string) => rowOf(text).closest("div.p-3")!.querySelector('[title^="Dra og slipp for å endre rekkefølge blant underfanene"]')!;
  const moveButtons = (text: string, sub: boolean) => {
    const row = rowOf(text).closest(sub ? "div.p-3" : "div.p-4")!;
    return {
      up: row.querySelector(`[aria-label="${sub ? "Flytt underfane opp" : "Flytt opp"}"]`) as HTMLButtonElement,
      down: row.querySelector(`[aria-label="${sub ? "Flytt underfane ned" : "Flytt ned"}"]`) as HTMLButtonElement,
    };
  };

  snap("initial");
  const first = moveButtons("Om oss", false), second = moveButtons("Grupper", false), last = moveButtons("Hva skjer", false);
  steps.push({ step: "disabled arrows", html: JSON.stringify([first.up.disabled, first.down.disabled, last.up.disabled, last.down.disabled]), calls: calls.length });
  fireEvent.click(first.up); fireEvent.click(last.down); snap("disabled arrows do nothing");
  fireEvent.click(first.down); snap("move first top down");
  fireEvent.click(second.up); snap("move second top up");
  fireEvent.click(moveButtons("Tro", true).up); fireEvent.click(moveButtons("Tro", true).down); snap("move sub up and down");
  fireEvent.click(moveButtons("Historie", true).up); fireEvent.click(moveButtons("Staben", true).down); snap("first sub up, last sub down: nothing");

  // Drag a main tab onto another: above, then below, then drop
  fireEvent.dragStart(topHandle("Om oss"), dt());
  snap("dragging top");
  fireEvent.dragOver(rowOf("Grupper"), { ...dt(), clientY: 120 }); snap("over top, upper half");
  fireEvent.dragOver(rowOf("Grupper"), { ...dt(), clientY: 180 }); snap("over top, lower half");
  fireEvent.dragOver(rowOf("Om oss"), { ...dt(), clientY: 180 }); snap("over itself");
  fireEvent.drop(rowOf("Hva skjer"), dt()); snap("dropped on third");
  fireEvent.dragStart(topHandle("Grupper"), dt());
  fireEvent.dragOver(rowOf("Om oss"), { ...dt(), clientY: 120 });
  fireEvent.drop(rowOf("Om oss"), dt()); snap("dropped before first");
  fireEvent.dragStart(topHandle("Hva skjer"), dt()); fireEvent.drop(rowOf("Grupper"), dt()); snap("drop without hovering first: cancelled");
  fireEvent.dragStart(topHandle("Hva skjer"), dt()); fireEvent.dragOver(rowOf("Grupper"), { ...dt(), clientY: 120 }); fireEvent.dragEnd(topHandle("Hva skjer")); snap("drag ended without drop");

  // Drag sub-pages: within a parent works, across parents does not, and a main tab cannot land on a sub-page
  fireEvent.dragStart(subHandle("Historie"), dt());
  fireEvent.dragOver(rowOf("Staben"), { ...dt(), clientY: 180 }); snap("sub over sub, lower half");
  fireEvent.drop(rowOf("Staben"), dt()); snap("sub dropped after third");
  fireEvent.dragStart(subHandle("Husfellesskap"), dt());
  fireEvent.dragOver(rowOf("Tro"), { ...dt(), clientY: 120 }); fireEvent.drop(rowOf("Tro"), dt()); snap("sub across parents: ignored");
  fireEvent.dragStart(topHandle("Om oss"), dt());
  fireEvent.dragOver(rowOf("Tro"), { ...dt(), clientY: 120 }); fireEvent.drop(rowOf("Tro"), dt()); snap("top onto sub: ignored");
  fireEvent.dragEnd(topHandle("Om oss"));

  // Buttons on every kind of row
  const statusButtons = [...q.querySelectorAll("button")].filter((x) => /Klikk for å/.test(x.getAttribute("aria-label") || ""));
  steps.push({ step: "status labels", html: JSON.stringify(statusButtons.map((x) => [x.getAttribute("aria-label"), x.getAttribute("title"), x.textContent])), calls: calls.length });
  statusButtons.forEach((x) => fireEvent.click(x));
  snap("status toggles");
  q.querySelectorAll('[title="Opprett ny underfane som legger seg under denne fanen"]').forEach((x) => fireEvent.click(x));
  [...q.querySelectorAll("button")].filter((x) => x.textContent === "Rediger" || x.textContent === "Tilordne overordnet fane").forEach((x) => fireEvent.click(x));
  [...q.querySelectorAll("button[title^='Slett']")].forEach((x) => fireEvent.click(x));
  [...q.querySelectorAll("button[aria-label^='Forhåndsvis']")].forEach((x) => fireEvent.click(x));
  snap("edit, delete, new and preview on every row");
  steps.push({ step: "text", html: (q.textContent || "").replace(/\s+/g, " "), calls: calls.length });
  steps.push({ step: "links", html: JSON.stringify([...q.querySelectorAll("a")].map((x) => [x.getAttribute("href"), x.getAttribute("target")])), calls: calls.length });

  Element.prototype.getBoundingClientRect = original;
  cleanup();
  vi.useRealTimers();
  return { steps, calls };
}

/** The same screen without any of the optional callbacks. */
export async function runPageTreeWithoutCallbacks(root: string) {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  const mod: any = await import(/* @vite-ignore */ root + "/src/pages/admin/tabs/pages/PageTreeList.tsx");
  const calls: unknown[] = [];
  const api = render(
    <MemoryRouter>
      <mod.PageTreeList hierarchicalPages={nodes} orphanPages={[]} onOpenNewPage={() => {}} onOpenEditPage={() => {}} onRequestDelete={(id: string) => calls.push(id)} />
    </MemoryRouter>
  );
  const q = api.container;
  const hadPreview = !!q.querySelector("[aria-label^='Forhåndsvis']");
  fireEvent.click(q.querySelector('[aria-label="Flytt ned"]')!);
  const toggle = [...q.querySelectorAll("button")].find((x) => /Klikk for å/.test(x.getAttribute("aria-label") || ""))!;
  fireEvent.click(toggle);
  fireEvent.click(q.querySelector('button[title="Slett fane"]')!);
  const out = { hadPreview, calls, html: hash(norm(q.innerHTML)) };
  cleanup();
  vi.useRealTimers();
  return out;
}
