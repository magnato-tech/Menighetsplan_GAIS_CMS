export type DynamicModuleType =
  | "module-worship"
  | "module-calendar"
  | "module-news"
  | "module-sermon"
  | "module-groups"
  | "module-giving";

export interface VisualBlock {
  id: string;
  type: DynamicModuleType | "text" | "grid" | "media-left" | "media-right" | "quote" | "callout" | "person-grid";
  title: string;
  isDynamic: boolean;
  hidden?: boolean;
  variant?: string;
  rawContent?: string;
}

export interface DynamicModuleMeta {
  type: DynamicModuleType;
  title: string;
  description: string;
  dataSource: string;
  supportedVariants: { id: string; label: string }[];
}

export const DYNAMIC_MODULES_META: Record<DynamicModuleType, DynamicModuleMeta> = {
  "module-worship": {
    type: "module-worship",
    title: "Neste gudstjeneste",
    description: "Henter automatisk neste fremhevede gudstjeneste med dato, tidspunkt og program.",
    dataSource: "Gudstjenesteplanleggeren (Firebase)",
    supportedVariants: [
      { id: "highlight", label: "Fremhevet kort" },
      { id: "compact", label: "Kompakt infolinje" },
    ],
  },
  "module-calendar": {
    type: "module-calendar",
    title: "Kalender: Hva skjer",
    description: "Viser de neste 4 planlagte arrangementene fra møtekalenderen.",
    dataSource: "Arrangementskalenderen (Firebase)",
    supportedVariants: [
      { id: "grid", label: "4 kort i grid" },
      { id: "list", label: "Vertikal tidslinje" },
    ],
  },
  "module-news": {
    type: "module-news",
    title: "Nyheter og artikler",
    description: "Viser de nyeste publiserte artiklene fra menighetsarbeidet.",
    dataSource: "CMS Nyhetsdatabase",
    supportedVariants: [
      { id: "grid", label: "3 artikkelkort" },
      { id: "compact", label: "Kompakt liste" },
    ],
  },
  "module-sermon": {
    type: "module-sermon",
    title: "Siste tale fra søndagen",
    description: "Spill av siste tale direkte med lyd og Spotify-integrasjon.",
    dataSource: "CMS Prekenarkiv",
    supportedVariants: [
      { id: "player", label: "Full spiller med bilde" },
      { id: "minimal", label: "Kompakt lydstripe" },
    ],
  },
  "module-groups": {
    type: "module-groups",
    title: "Husfellesskap & Grupper",
    description: "Banner og snarvei til å bli med i et nært fellesskap.",
    dataSource: "Fellesskapsregisteret",
    supportedVariants: [
      { id: "banner", label: "Stort gradientbanner" },
      { id: "cards", label: "2 oppdelte infokort" },
    ],
  },
  "module-giving": {
    type: "module-giving",
    title: "Givertjeneste & Vipps",
    description: "Viser menighetens Vipps-nummer og bankkonto for gaver.",
    dataSource: "Menighetsinnstillinger",
    supportedVariants: [
      { id: "card", label: "Både Vipps og bankkonto" },
      { id: "vipps", label: "Kun Vipps-fokus" },
    ],
  },
};

/**
 * Parses a raw CMS content string into an array of VisualBlocks
 */
export function parseContentToVisualBlocks(content: string): VisualBlock[] {
  if (!content || !content.trim()) return [];

  const lines = content.split("\n");
  const blocks: VisualBlock[] = [];
  let textBuffer: string[] = [];

  const flushTextBuffer = () => {
    const raw = textBuffer.join("\n").trim();
    if (raw) {
      // Find a suitable title from the first heading or line
      const firstLine = raw.split("\n")[0].trim().replace(/^#+\s*/, "");
      const title = firstLine.length > 0 ? (firstLine.length > 40 ? firstLine.slice(0, 37) + "..." : firstLine) : "Tekstavsnitt";
      blocks.push({
        id: `block-text-${blocks.length}-${Math.random().toString(36).substring(2, 6)}`,
        type: "text",
        title,
        isDynamic: false,
        rawContent: raw,
      });
    }
    textBuffer = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Dynamic module match: :::module-[name][variant]
    const moduleMatch = trimmed.match(/^:::module-([a-zA-Z0-9_-]+)(?:\[([a-zA-Z0-9_-]+)\])?/);
    if (moduleMatch) {
      flushTextBuffer();
      const modName = `module-${moduleMatch[1]}` as DynamicModuleType;
      const variant = moduleMatch[2] || DYNAMIC_MODULES_META[modName]?.supportedVariants[0]?.id || "default";

      // Consume until closing ::: if present
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) {
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(":::")) {
        i++;
      }

      const meta = DYNAMIC_MODULES_META[modName];
      blocks.push({
        id: `block-${modName}-${blocks.length}-${Math.random().toString(36).substring(2, 6)}`,
        type: modName,
        title: meta?.title || `Modul: ${moduleMatch[1]}`,
        isDynamic: true,
        variant,
      });
      continue;
    }

    // 2. Personer / stab grid: :::personer[filter] or :::person-grid[filter]
    if (trimmed.startsWith(":::personer") || trimmed.startsWith(":::person-grid")) {
      flushTextBuffer();
      const match = trimmed.match(/:::(?:personer|person-grid)(?:\[(.*?)\])?/);
      const filter = match?.[1] || "alle";
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) {
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(":::")) {
        i++;
      }
      blocks.push({
        id: `block-person-grid-${blocks.length}`,
        type: "person-grid",
        title: filter === "stab" ? "Stab & Ansatte" : filter === "eldsterad" ? "Eldsteråd" : "Personoversikt",
        isDynamic: true,
        variant: filter,
      });
      continue;
    }

    // 3. Structured blocks: :::grid, :::media-left, :::media-right, :::quote, :::callout
    if (
      trimmed.startsWith(":::grid") ||
      trimmed.startsWith(":::media-left") ||
      trimmed.startsWith(":::media-right") ||
      trimmed.startsWith(":::quote") ||
      trimmed.startsWith(":::callout")
    ) {
      flushTextBuffer();
      const blockLines = [line];
      const blockType = trimmed.startsWith(":::grid")
        ? "grid"
        : trimmed.startsWith(":::media-left")
        ? "media-left"
        : trimmed.startsWith(":::media-right")
        ? "media-right"
        : trimmed.startsWith(":::quote")
        ? "quote"
        : "callout";

      i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) {
        blockLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(":::")) {
        blockLines.push(lines[i]);
        i++;
      }

      const fullBlockContent = blockLines.join("\n");
      const titleMap = {
        grid: "Kort-grid (2 kolonner)",
        "media-left": "Bilde med tekst (Venstre)",
        "media-right": "Bilde med tekst (Høyre)",
        quote: "Sitatblokk",
        callout: "Fremhevet infoboks",
      };

      blocks.push({
        id: `block-${blockType}-${blocks.length}-${Math.random().toString(36).substring(2, 6)}`,
        type: blockType,
        title: titleMap[blockType] || "Innholdsblokk",
        isDynamic: false,
        rawContent: fullBlockContent,
      });
      continue;
    }

    // Regular line, append to text buffer
    textBuffer.push(line);
    i++;
  }

  flushTextBuffer();
  return blocks;
}

/**
 * Serializes an array of VisualBlocks back into a clean CMS content string
 */
export function serializeVisualBlocksToContent(blocks: VisualBlock[]): string {
  if (!blocks || blocks.length === 0) return "";

  const segments: string[] = [];

  for (const block of blocks) {
    if (block.type.startsWith("module-")) {
      const variantStr = block.variant ? `[${block.variant}]` : "";
      segments.push(`:::${block.type}${variantStr}\n:::`);
    } else if (block.type === "person-grid") {
      const filterStr = block.variant ? `[${block.variant}]` : "";
      segments.push(`:::personer${filterStr}\n:::`);
    } else if (block.rawContent) {
      segments.push(block.rawContent.trim());
    }
  }

  return segments.join("\n\n");
}

/**
 * Returns default visual blocks for the Forside page
 */
export function getDefaultForsideBlocks(): VisualBlock[] {
  return [
    {
      id: "forside-worship",
      type: "module-worship",
      title: "Neste gudstjeneste",
      isDynamic: true,
      variant: "highlight",
    },
    {
      id: "forside-text-welcome",
      type: "text",
      title: "Velkommen til menighetens fellesskap",
      isDynamic: false,
      rawContent: "## Velkommen til Lillesand Misjonskirke\nEt åpent hjem for alle generasjoner. Vi samles til gudstjeneste, bønn og nære fellesskap der tro og hverdag møtes.",
    },
    {
      id: "forside-calendar",
      type: "module-calendar",
      title: "Kalender: Hva skjer",
      isDynamic: true,
      variant: "grid",
    },
    {
      id: "forside-news",
      type: "module-news",
      title: "Nyheter og artikler",
      isDynamic: true,
      variant: "grid",
    },
    {
      id: "forside-sermon",
      type: "module-sermon",
      title: "Siste tale fra søndagen",
      isDynamic: true,
      variant: "player",
    },
    {
      id: "forside-groups",
      type: "module-groups",
      title: "Husfellesskap & Grupper",
      isDynamic: true,
      variant: "banner",
    },
    {
      id: "forside-giving",
      type: "module-giving",
      title: "Givertjeneste & Vipps",
      isDynamic: true,
      variant: "card",
    },
  ];
}
