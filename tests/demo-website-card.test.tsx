// @vitest-environment jsdom
import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const { pages } = vi.hoisted(() => ({ pages: [] as { id: string }[] }));
vi.mock("../src/context/CmsContext", () => ({ useCms: () => ({ pages }) }));
vi.mock("../src/services/databaseAdmin", () => ({ populateDemoWebsite: vi.fn() }));

import { DemoWebsiteCard } from "../src/components/admin/DemoWebsiteCard";
import { populateDemoWebsite } from "../src/services/databaseAdmin";

const showFeedback = vi.fn();
const open = () => {
  render(<DemoWebsiteCard showFeedback={showFeedback} />);
  fireEvent.click(screen.getByRole("button", { name: "Legg inn demo-nettsiden" }));
  return screen.getByRole("dialog");
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  pages.length = 0;
});

describe("Demo-nettsiden legges inn for seg", () => {
  test("det spørres først, og spørsmålet sier at innstillingene byttes og at sidene som ligger der, blir stående", () => {
    pages.push(...Array.from({ length: 22 }, (_, i) => ({ id: `page-${i}` })));
    const dialog = open();

    expect(dialog.textContent).toContain("Menighetens navn og de andre innstillingene for nettsiden byttes");
    expect(dialog.textContent).toContain("Nettsiden har 22 sider fra før. Ingenting slettes");
    expect(dialog.textContent).toContain("Planleggeren røres ikke.");
    expect(populateDemoWebsite).not.toHaveBeenCalled();
  });

  test("ja legger inn demo-nettsiden og sier hva som er gjort", async () => {
    vi.mocked(populateDemoWebsite).mockResolvedValue({ success: true, counts: {}, total: 41, failures: [] });
    const dialog = open();
    expect(dialog.textContent).toContain("Nettsiden har ingen sider fra før.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Ja, legg inn" }));

    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith("Demo-nettsiden er lagt inn (41 dokumenter). Planleggeren er ikke rørt.")
    );
    expect(populateDemoWebsite).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("avbryt gjør ingenting, og en feil meldes som feil", async () => {
    fireEvent.click(within(open()).getByRole("button", { name: "Avbryt" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(populateDemoWebsite).not.toHaveBeenCalled();

    vi.mocked(populateDemoWebsite).mockResolvedValue({
      success: false,
      counts: {},
      total: 0,
      failures: [{ collection: "cms_pages", message: "Ingen tilgang" }],
    });
    fireEvent.click(screen.getByRole("button", { name: "Legg inn demo-nettsiden" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Ja, legg inn" }));
    await waitFor(() =>
      expect(showFeedback).toHaveBeenCalledWith("Demo-nettsiden ble ikke lagt inn i sin helhet: Ingen tilgang", "error")
    );
  });
});
