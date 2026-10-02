import React from "react";
import { AdminCmsPanel, AdminCmsPanelProps } from "../../../components/admin/AdminCmsPanel";

export type PagesTabProps = AdminCmsPanelProps;

export const PagesTab: React.FC<PagesTabProps> = (props) => {
  return <AdminCmsPanel {...props} />;
};

export { AdminCmsPanel };
