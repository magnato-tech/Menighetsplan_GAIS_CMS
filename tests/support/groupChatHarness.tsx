import { createHash } from "node:crypto";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { vi } from "vitest";

/**
 * Runs the group chat through fixed interactions and records what it shows and does: what is sent and
 * deleted, what the person is told, and how the room looks after each step. The golden file holds the
 * result from before the component was split up.
 */

const NOW = new Date("2026-10-07T12:00:00.000Z");
const norm = (html: string) => html.replace(/class="([^"]*)"/g, (_m, c) => 'class="' + c.split(/\s+/).filter(Boolean).sort().join(" ") + '"');
const hash = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

const me = { id: "p1", name: "Kari", globalRole: "member" };
const msg = (id: string, from: string, senderName: string, content: string, extra: Record<string, unknown> = {}) => ({
  id, groupId: "g1", senderPersonId: from, senderName, content, createdAt: "2026-10-06T08:15:00.000Z", ...extra,
});
const messages = [
  msg("m1", "p2", "Ola", "Hei alle sammen"),
  msg("m2", "p1", "Kari", "Se her https://example.com/side og https://example.com/to, takk!", { createdAt: "2026-10-06T09:00:00.000Z" }),
  msg("m3", "p2", "Ola", "Prekenen: https://www.youtube.com/watch?v=abc123 og kort lenke https://youtu.be/xyz789 og igjen https://www.youtube.com/watch?v=abc123"),
  msg("m4", "p1", "Kari", "", { imageUrl: "https://x/bilde.png" }),
  msg("m5", "p2", "Ola", "Bilde med tekst", { imageUrl: "https://x/annet.png" }),
  msg("m6", "p2", "Ola", "https://www.youtube.com/feed og https://youtube.com/watch og tekst uten lenke"),
];

interface World {
  group?: unknown;
  isMember: boolean;
  messages: unknown[];
  notificationsEnabled: boolean;
  sendResult: any;
  deleteResult: any;
  calls: unknown[][];
}
const world: World = { isMember: true, messages, notificationsEnabled: true, sendResult: { success: true }, deleteResult: { success: true }, calls: [] };

async function load(root: string) {
  vi.resetModules();
  const real = await vi.importActual<Record<string, unknown>>(root + "/src/hooks/useAppHooks");
  vi.doMock(root + "/src/hooks/useAppHooks", () => ({
    ...real,
    useGroupRoom: () => ({
      group: world.group,
      isMember: world.isMember,
      messages: world.messages,
      sendMessage: (...a: unknown[]) => (world.calls.push(["send", ...a]), world.sendResult),
      deleteMessage: (...a: unknown[]) => (world.calls.push(["delete", ...a]), world.deleteResult),
      notificationsEnabled: world.notificationsEnabled,
      toggleNotifications: () => world.calls.push(["toggleNotifications"]),
      currentUser: me,
    }),
  }));
  const mod: any = await import(/* @vite-ignore */ root + "/src/components/GroupChat.tsx");
  return mod.GroupChat;
}

export async function runGroupChat(root: string) {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  const steps: { step: string; html: string; extra?: unknown }[] = [];
  const GroupChat = await load(root);

  // jsdom has no layout, so give the feed a height and see that the chat scrolls to it
  Object.defineProperty(HTMLElement.prototype, "scrollHeight", { configurable: true, get: () => 4321 });

  const open = (opts: Partial<World> = {}) => {
    Object.assign(world, { group: { id: "g1", name: "Husfellesskap" }, isMember: true, messages, notificationsEnabled: true, sendResult: { success: true }, deleteResult: { success: true }, calls: [] }, opts);
    return render(<GroupChat groupId="g1" />);
  };
  const snap = (api: ReturnType<typeof render>, step: string, extra?: unknown) => steps.push({ step, html: hash(norm(api.container.innerHTML)), extra: extra === undefined ? undefined : JSON.parse(JSON.stringify(extra)) });
  const q = (api: ReturnType<typeof render>, sel: string) => api.container.querySelector(sel) as HTMLElement;
  const type = (api: ReturnType<typeof render>, text: string) => fireEvent.change(q(api, "#input-chat-message"), { target: { value: text } });

  let api = open({ group: undefined }); snap(api, "no group"); cleanup();
  api = open({ isMember: false }); snap(api, "not a member"); cleanup();
  api = open({ messages: [] }); snap(api, "no messages", (api.container.textContent || "").match(/\d+ melding\w*/)?.[0]); cleanup();
  api = open({ messages: [messages[0]] }); snap(api, "one message", (api.container.textContent || "").match(/\d+ melding\w*/)?.[0]); cleanup();

  api = open();
  snap(api, "with messages", { scrollTop: q(api, "#chat-messages-container-g1").scrollTop, counter: (api.container.textContent || "").match(/\d+ meldinger/)?.[0] });
  steps.push({ step: "links", html: JSON.stringify([...api.container.querySelectorAll("a")].map((a) => [a.getAttribute("href"), a.getAttribute("target"), a.getAttribute("rel"), (a.textContent || "").slice(0, 60)])) });
  steps.push({ step: "own messages have a delete button, others do not", html: JSON.stringify([...api.container.querySelectorAll("[id^=chat-msg-]")].map((m) => [m.id, !!m.querySelector("[id^=btn-delete-msg-]")])) });
  fireEvent.click(q(api, "#btn-toggle-notifications")); snap(api, "notifications toggle on", { title: q(api, "#btn-toggle-notifications").getAttribute("title"), calls: world.calls.length });
  cleanup();
  api = open({ notificationsEnabled: false }); snap(api, "notifications off", q(api, "#btn-toggle-notifications").getAttribute("title")); cleanup();

  // Writing and sending
  api = open();
  const sendButton = () => q(api, "#btn-send-chat-message") as HTMLButtonElement;
  snap(api, "send disabled when empty", sendButton().disabled);
  type(api, "   "); snap(api, "send still disabled for blanks", sendButton().disabled);
  type(api, "  Hei på deg  "); snap(api, "send enabled", sendButton().disabled);
  fireEvent.keyDown(q(api, "#input-chat-message"), { key: "Enter", shiftKey: true }); snap(api, "shift+enter does not send", world.calls.length);
  fireEvent.keyDown(q(api, "#input-chat-message"), { key: "Enter" }); snap(api, "enter sends and clears", [world.calls.length, (q(api, "#input-chat-message") as HTMLTextAreaElement).value]);
  type(api, "Neste"); fireEvent.click(sendButton()); snap(api, "button sends");
  world.sendResult = { success: false, error: "Du er ikke medlem av denne gruppen." };
  type(api, "Feiler"); fireEvent.click(sendButton()); snap(api, "failed send keeps the text and tells why", (q(api, "#input-chat-message") as HTMLTextAreaElement).value);
  world.sendResult = { success: false };
  fireEvent.click(sendButton()); snap(api, "failed send without a reason says nothing");
  world.sendResult = { success: true };
  steps.push({ step: "sends", html: JSON.stringify(world.calls) });

  // Pictures
  const file = (bytes: number, name = "bilde.png") => new File([new Uint8Array(Math.min(bytes, 16))], name, { type: "image/png" });
  const tooBig = file(10); Object.defineProperty(tooBig, "size", { value: 6 * 1024 * 1024 });
  fireEvent.change(q(api, "#chat-file-input"), { target: { files: [tooBig] } }); snap(api, "picture over 5 MB is refused");
  const small = file(10); Object.defineProperty(small, "size", { value: 1024 });
  fireEvent.change(q(api, "#chat-file-input"), { target: { files: [small] } });
  await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
  snap(api, "picture chosen shows a preview", [!!api.container.querySelector('img[alt="Forhåndsvisning"]'), (q(api, "#chat-file-input") as HTMLInputElement).value]);
  world.calls = [];
  fireEvent.click(sendButton()); steps.push({ step: "a picture can be sent alone", html: JSON.stringify(world.calls.map((c) => [c[0], c[1], typeof c[2] === "string" && String(c[2]).startsWith("data:image/png;base64,") ? "data-url" : c[2]])) });
  snap(api, "after sending the picture the preview is gone");
  fireEvent.click(api.getByText("🍕 Fellesskap / Mat")); snap(api, "quick picture chosen");
  fireEvent.click(q(api, "#btn-remove-selected-image")); snap(api, "picture removed");
  fireEvent.click(api.getByText("☕ Kaffekos")); type(api, "Med bilde"); world.calls = [];
  fireEvent.click(sendButton()); steps.push({ step: "text and quick picture together", html: JSON.stringify(world.calls) });
  fireEvent.click(q(api, "#btn-attach-image")); steps.push({ step: "attach button clicks the hidden input", html: "ok" });
  cleanup();

  // Opening a picture, and deleting a message
  api = open();
  fireEvent.click(q(api, "#chat-msg-m4 img")); snap(api, "picture opened in lightbox", (q(api, "#modal-chat-lightbox").textContent || "").replace(/\s+/g, " "));
  fireEvent.click(q(api, "#modal-chat-lightbox img")); snap(api, "click on the picture keeps the lightbox open");
  fireEvent.click(q(api, "#btn-close-lightbox")); snap(api, "lightbox closed by the button");
  fireEvent.click(q(api, "#chat-msg-m5 img")); fireEvent.click(q(api, "#modal-chat-lightbox")); snap(api, "lightbox closed by the backdrop");
  fireEvent.click(q(api, "#btn-delete-msg-m2")); snap(api, "delete asks first");
  fireEvent.click(q(api, "#btn-cancel-delete-msg")); snap(api, "delete cancelled", world.calls.length);
  world.calls = [];
  fireEvent.click(q(api, "#btn-delete-msg-m2")); fireEvent.click(q(api, "#btn-confirm-delete-msg")); snap(api, "delete confirmed tells it was deleted", world.calls);
  world.deleteResult = { success: false, error: "Kunne ikke slette." };
  fireEvent.click(q(api, "#btn-delete-msg-m4")); fireEvent.click(q(api, "#btn-confirm-delete-msg")); snap(api, "failed delete tells why", world.calls);
  fireEvent.click(api.container.querySelector("button svg.lucide-x")!.closest("button")!); snap(api, "message closed by its X");
  cleanup();

  delete (HTMLElement.prototype as any).scrollHeight;
  vi.useRealTimers();
  return { steps };
}
