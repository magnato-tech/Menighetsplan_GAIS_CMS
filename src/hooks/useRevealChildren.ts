import { useEffect, useRef } from "react";

/** How long after the card before it the next card starts to appear. */
const STAGGER_MS = 90;
/** How long to wait for the browser's first word about the cards before showing them all. */
const SILENCE_MS = 3000;

/**
 * Lets the cards in a list fade in and rise a little, once, as they scroll into view.
 * Put the returned ref on the list and give it the class `reveal-children` (see index.css).
 *
 * A list is never left invisible. The cards are only held back once this hook has taken
 * hold of the list, and every way the watching can fail ends with the cards showing:
 * a browser that cannot watch for elements coming into view shows them at once, and a
 * browser that stays silent (a page that is not being drawn, such as a background tab)
 * shows them after a short wait. Visitors who have asked for less motion get the cards
 * without movement (handled in the stylesheet).
 *
 * `count` is the number of cards. Cards that arrive later are picked up when it changes.
 */
export function useRevealChildren<T extends HTMLElement>(count: number) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list) return;
    const waiting = ([...list.children] as HTMLElement[]).filter((card) => !card.dataset.revealed);
    const showAll = () => {
      for (const card of waiting) card.dataset.revealed = "true";
    };

    if (typeof IntersectionObserver === "undefined") {
      showAll();
      return;
    }

    list.dataset.revealReady = "true";
    // A working browser reports on every card right away, in view or not
    let heard = false;
    const observer = new IntersectionObserver(
      (entries) => {
        heard = true;
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, index) => {
            const card = entry.target as HTMLElement;
            card.style.animationDelay = `${index * STAGGER_MS}ms`;
            card.dataset.revealed = "true";
            observer.unobserve(card);
          });
      },
      // A card counts as in view when a good part of it has cleared the bottom edge
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    for (const card of waiting) observer.observe(card);
    const silence = window.setTimeout(() => {
      if (!heard) showAll();
    }, SILENCE_MS);

    return () => {
      window.clearTimeout(silence);
      observer.disconnect();
    };
  }, [count]);

  return ref;
}
