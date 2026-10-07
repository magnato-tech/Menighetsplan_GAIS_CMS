import type { TrafficTarget } from "./siteTraffic";

// What one opening of the website amounts to, as it happens: which pages are shown, in what
// order, and for how long each is in view. The tracker keeps this in memory only, for as long
// as the website stays open in the tab, and hands every count on to a recorder at once. It
// knows nothing about who the visitor is, and nothing is kept between openings.

/** Where the counts go. See services/siteTraffic.ts. */
export interface TrafficRecorder {
  /** A page is shown. `entry` when it is the first page of the visit, `second` when it is the second. */
  view(address: string, at: Date, visit: { entry: boolean; second: boolean }): void;
  /** More seconds a page has been in view. */
  seconds(address: string, at: Date, seconds: number): void;
  /** An address was asked for that no page answers to. */
  missing(address: string, at: Date): void;
}

/** A page left open counts for half an hour at most, so a forgotten tab does not pass for reading. */
export const MAX_SECONDS_PER_VIEW = 30 * 60;

/**
 * Seconds in view at which what has been seen so far is sent: early and often at first, then
 * once a minute. What is seen after the last mark is sent when the page is left, but a tab that
 * is closed does not always get to send it, so the marks decide how much a visit can lose.
 */
const FIRST_MARKS = [5, 15, 30, 60];

interface PageInView {
  address: string;
  /** When the page last came into view, or null while it is out of view. */
  visibleSince: number | null;
  visibleMs: number;
  sentSeconds: number;
}

export class VisitTracker {
  private pagesShown = 0;
  private current: PageInView | null = null;
  private lastShown: string | null = null;

  constructor(
    private readonly recorder: TrafficRecorder,
    private visible = true
  ) {}

  /**
   * An address is shown, or, with null, the visitor has left the public website. Showing the
   * same address again without anything in between (a re-render, a jump within the page) is the
   * same view and is not counted twice.
   */
  show(target: TrafficTarget, nowMs: number): void {
    const shown = target ? `${target.kind}:${target.address}` : null;
    if (shown === this.lastShown) return;
    this.leave(nowMs);
    this.lastShown = shown;
    if (!target) return;

    const at = new Date(nowMs);
    if (target.kind === "missing") {
      this.recorder.missing(target.address, at);
      return;
    }
    this.pagesShown += 1;
    this.recorder.view(target.address, at, { entry: this.pagesShown === 1, second: this.pagesShown === 2 });
    this.current = { address: target.address, visibleSince: this.visible ? nowMs : null, visibleMs: 0, sentSeconds: 0 };
  }

  /** The tab came into view or went out of it. Time only runs while the page can be seen. */
  setVisible(visible: boolean, nowMs: number): void {
    if (visible === this.visible) return;
    if (!visible) this.flush(nowMs);
    this.visible = visible;
    if (this.current) this.current.visibleSince = visible ? nowMs : null;
  }

  /** Sends the whole seconds seen since the last time. Done at intervals, so a closed tab loses little. */
  flush(nowMs: number): void {
    const page = this.current;
    if (!page) return;
    if (page.visibleSince !== null) {
      page.visibleMs += Math.max(0, nowMs - page.visibleSince);
      page.visibleSince = nowMs;
    }
    const seconds = Math.min(MAX_SECONDS_PER_VIEW, Math.floor(page.visibleMs / 1000));
    const unsent = seconds - page.sentSeconds;
    if (unsent < 1) return;
    this.recorder.seconds(page.address, new Date(nowMs), unsent);
    page.sentSeconds = seconds;
  }

  /** How long until the next flush is due, or null while no time is running. */
  nextFlushInMs(nowMs: number): number | null {
    const page = this.current;
    if (!page || page.visibleSince === null) return null;
    const seenMs = page.visibleMs + Math.max(0, nowMs - page.visibleSince);
    if (seenMs >= MAX_SECONDS_PER_VIEW * 1000) return null;
    const seen = seenMs / 1000;
    const next = FIRST_MARKS.find((mark) => mark > seen) ?? (Math.floor(seen / 60) + 1) * 60;
    return Math.max(250, next * 1000 - seenMs);
  }

  /** The page in view is left: what is left of its time is sent, and no more is counted for it. */
  private leave(nowMs: number): void {
    this.flush(nowMs);
    this.current = null;
  }
}
