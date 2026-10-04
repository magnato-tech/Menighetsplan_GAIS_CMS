import React from "react";
import { VisualBlock } from "../../utils/cmsBlocks";
import { readSectionAnchor, stripSectionAnchorComment } from "../../utils/cmsLinks";
import { readModulePresentation } from "../../utils/modulePresentation";
import { CmsContentRenderer } from "./CmsContentRenderer";
import { WorshipModule } from "./modules/WorshipModule";
import { CalendarModule } from "./modules/CalendarModule";
import { KalenderModule } from "./modules/KalenderModule";
import { NewsModule } from "./modules/NewsModule";
import { SermonModule } from "./modules/SermonModule";
import { GroupsModule } from "./modules/GroupsModule";
import { GivingModule } from "./modules/GivingModule";

interface VisualBlockFlowProps {
  blocks: VisualBlock[];
  /** Static pages already sit in a narrow column, so text blocks skip the extra page gutter. */
  embed?: boolean;
}

function BlockBody({ block, embed }: { block: VisualBlock; embed: boolean }) {
  const presentation =
    block.type.startsWith("module-") ? readModulePresentation(block) : undefined;

  switch (block.type) {
    case "module-worship":
      return (
        <WorshipModule
          variant={block.variant as "highlight" | "compact"}
          presentation={presentation}
        />
      );
    case "module-calendar":
      return <CalendarModule presentation={presentation} />;
    case "module-kalender":
      return (
        <KalenderModule
          variant={block.variant as "month" | "list"}
          presentation={presentation}
        />
      );
    case "module-news":
      return (
        <NewsModule
          variant={block.variant as "grid" | "compact"}
          presentation={presentation}
        />
      );
    case "module-sermon":
      return (
        <SermonModule
          variant={block.variant as "player" | "minimal"}
          presentation={presentation}
        />
      );
    case "module-groups":
      return (
        <GroupsModule
          variant={block.variant as "banner" | "cards"}
          presentation={presentation}
        />
      );
    case "module-giving":
      return (
        <GivingModule
          variant={block.variant as "card" | "vipps"}
          presentation={presentation}
        />
      );
    case "person-grid":
      return <CmsContentRenderer content={`:::personer[${block.variant || "alle"}]\n:::`} />;
    default: {
      const content = stripSectionAnchorComment(block.rawContent || "");
      const body = <CmsContentRenderer content={content} />;
      if (embed) return body;
      return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6">{body}</div>;
    }
  }
}

export const VisualBlockFlow: React.FC<VisualBlockFlowProps> = ({ blocks, embed = false }) => {
  return (
    <div className="space-y-6">
      {blocks.map((block, idx) => {
        if (block.hidden) return null;
        const sectionAnchor = readSectionAnchor(block);
        return (
          <div
            key={block.id || idx}
            id={sectionAnchor || undefined}
            data-cms-block={block.type}
            data-cms-variant={block.variant || ""}
            data-cms-preview-target={block.id || `block-${idx}`}
          >
            <BlockBody block={block} embed={embed} />
          </div>
        );
      })}
    </div>
  );
};
