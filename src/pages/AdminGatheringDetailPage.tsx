import React from "react";
import { GatheringDetailView } from "../components/GatheringDetailView";
import { useAdminDetailRoute } from "../utils/adminStudioRoutes";

export const AdminGatheringDetailPage: React.FC = () => {
  const detailRoute = useAdminDetailRoute();
  const gatheringId = detailRoute?.kind === "gathering" ? detailRoute.id : "";

  return <GatheringDetailView gatheringId={gatheringId} mode="admin" />;
};
