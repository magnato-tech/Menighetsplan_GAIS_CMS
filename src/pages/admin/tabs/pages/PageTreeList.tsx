import React from "react";
import { CmsPage } from "../../../../data/cmsData";
import { PageNode } from "../../../../utils/menu";
import { stepInList } from "../../../../utils/pageOrder";
import { OrphanPagesList } from "./OrphanPagesList";
import { TopPageRow } from "./TopPageRow";
import type { PageActions } from "./pageTreeTypes";
import { usePageDragReorder } from "./usePageDragReorder";

interface PageTreeListProps extends PageActions {
  hierarchicalPages: PageNode[];
  orphanPages: CmsPage[];
  onReorder?: (orderedPageIds: string[]) => void;
}

export const PageTreeList: React.FC<PageTreeListProps> = ({ hierarchicalPages, orphanPages, onReorder, ...actions }) => {
  const drag = usePageDragReorder(onReorder);
  const topLevelPages = hierarchicalPages.map((n) => n.page);

  const handleMoveStep = (siblings: CmsPage[], pageId: string, direction: "up" | "down") => {
    const next = stepInList(
      siblings.map((p) => p.id),
      pageId,
      direction
    );
    if (next) onReorder?.(next);
  };

  return (
    <div className="space-y-4">
      {hierarchicalPages.map((node, index) => (
        <TopPageRow
          key={node.page.id}
          node={node}
          index={index}
          topLevelPages={topLevelPages}
          drag={drag}
          onMoveStep={handleMoveStep}
          {...actions}
        />
      ))}

      {orphanPages.length > 0 && (
        <OrphanPagesList
          pages={orphanPages}
          onOpenEditPage={actions.onOpenEditPage}
          onPreviewPage={actions.onPreviewPage}
          onTogglePublish={actions.onTogglePublish}
        />
      )}
    </div>
  );
};
