import React from "react";
import { useParams } from "react-router-dom";
import { GatheringDetailView } from "../components/GatheringDetailView";

export const AdminGatheringDetailPage: React.FC = () => {
  const { gatheringId } = useParams<{ gatheringId: string }>();

  return <GatheringDetailView gatheringId={gatheringId || ""} mode="admin" />;
};
