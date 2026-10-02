import type { useLeaderGroupDetail } from "../../hooks/leaderHooks";

/**
 * Everything useLeaderGroupDetail returns. LeaderGroupDetailPage calls the hook
 * once and hands the result to the parts of the page.
 */
export type LeaderGroupDetail = ReturnType<typeof useLeaderGroupDetail>;
