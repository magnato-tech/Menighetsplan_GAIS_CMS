import type { useHusfellesskap } from "../../hooks/useHusfellesskap";

/**
 * Everything useHusfellesskap returns. HusfellesskapView calls the hook once
 * and hands the result to its tabs and dialogs.
 */
export type HusfellesskapModel = ReturnType<typeof useHusfellesskap>;
