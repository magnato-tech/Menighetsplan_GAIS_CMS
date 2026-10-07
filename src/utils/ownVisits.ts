// Whether this browser's own visits to the website are left out of the counting. It is the
// choice of whoever works on the website, made on the board, and it is remembered in that
// person's own browser. A visitor never has it set: nothing is stored for a visitor.

const KEY = "menighetsplan_tell_ikke_mine_besok";

export function areOwnVisitsExcluded(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    // Storage that cannot be read holds no choice, so the visit is counted like any other
    return false;
  }
}

/** Remembers the choice in this browser. Returns whether it could be remembered. */
export function setOwnVisitsExcluded(excluded: boolean): boolean {
  try {
    if (excluded) localStorage.setItem(KEY, "1");
    else localStorage.removeItem(KEY);
    return true;
  } catch {
    // A browser that will not store it keeps counting; the board says so
    return false;
  }
}
