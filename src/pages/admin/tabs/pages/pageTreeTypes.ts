import type { CmsPage } from "../../../../data/cmsData";

/** What can be done with a page in the tree. */
export interface PageActions {
  onOpenNewPage: (parentId?: string | null) => void;
  onOpenEditPage: (page: CmsPage) => void;
  onRequestDelete: (pageId: string) => void;
  onPreviewPage?: (page: CmsPage) => void;
  onTogglePublish?: (page: CmsPage) => void;
}
