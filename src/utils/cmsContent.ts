export type ParsedBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "callout"; variant: "info" | "warning" | "success" | "primary"; title?: string; body: string }
  | { type: "media"; alignment: "left" | "right"; imageUrl: string; title?: string; body: string }
  | { type: "grid"; cards: { title?: string; body: string }[] }
  | { type: "quote"; text: string; author?: string }
  | { type: "cta"; label: string; url: string; primary?: boolean }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "paragraph"; text: string }
  | { type: "person-grid"; filter: string }
  | { type: "spacer" };

/**
 * Parses CMS markdown with support for controlled components and safe formatting.
 * Sandboxes all output so it cannot disrupt outer navigation or global layout.
 */
export function parseCmsContent(rawContent: string): ParsedBlock[] {
  if (!rawContent || !rawContent.trim()) return [];

  const lines = rawContent.split("\n");
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line / spacer
    if (trimmed === "") {
      // Avoid excessive blank spacers
      if (blocks.length > 0 && blocks[blocks.length - 1].type !== "spacer") {
        blocks.push({ type: "spacer" });
      }
      i++;
      continue;
    }

    // Callout block syntax: :::callout[variant]
    if (trimmed.startsWith(":::callout")) {
      const match = trimmed.match(/:::callout(?:\[([a-zA-Z0-9_-]+)\])?(?:\s+(.+))?/);
      const rawVariant = match?.[1]?.toLowerCase() || "info";
      const inlineTitle = match?.[2]?.trim();
      const variant: "info" | "warning" | "success" | "primary" =
        rawVariant === "warning" || rawVariant === "alert" || rawVariant === "important"
          ? "warning"
          : rawVariant === "success" || rawVariant === "tip"
          ? "success"
          : rawVariant === "primary"
          ? "primary"
          : "info";

      const bodyLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) {
        bodyLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(":::")) {
        i++; // skip closing :::
      }
      blocks.push({
        type: "callout",
        variant,
        title: inlineTitle,
        body: bodyLines.join("\n").trim(),
      });
      continue;
    }

    // Media with text syntax: :::media-left[url] or :::media-right[url]
    if (trimmed.startsWith(":::media-left") || trimmed.startsWith(":::media-right")) {
      const alignment: "left" | "right" = trimmed.startsWith(":::media-left") ? "left" : "right";
      const match = trimmed.match(/:::media-(?:left|right)(?:\[(.*?)\])?(?:\s+(.+))?/);
      const imageUrl = match?.[1]?.trim() || "";
      const inlineTitle = match?.[2]?.trim();

      const mediaBodyLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) {
        mediaBodyLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(":::")) {
        i++;
      }

      // If first line in body is a heading (### Tittel), extract it for cleaner display
      let title = inlineTitle;
      let bodyContent = mediaBodyLines;
      if (!title && mediaBodyLines.length > 0 && mediaBodyLines[0].trim().startsWith("### ")) {
        title = mediaBodyLines[0].trim().replace("### ", "");
        bodyContent = mediaBodyLines.slice(1);
      } else if (!title && mediaBodyLines.length > 0 && mediaBodyLines[0].trim().startsWith("## ")) {
        title = mediaBodyLines[0].trim().replace("## ", "");
        bodyContent = mediaBodyLines.slice(1);
      }

      blocks.push({
        type: "media",
        alignment,
        imageUrl,
        title,
        body: bodyContent.join("\n").trim(),
      });
      continue;
    }

    // GitHub-style alerts: > [!NOTE], > [!IMPORTANT], > [!WARNING], > [!TIP]
    if (trimmed.startsWith("> [!") && trimmed.endsWith("]")) {
      const alertType = trimmed.replace("> [!", "").replace("]", "").toLowerCase();
      const variant: "info" | "warning" | "success" | "primary" =
        alertType === "warning" || alertType === "caution" || alertType === "important"
          ? "warning"
          : alertType === "tip"
          ? "success"
          : "info";

      const alertBodyLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        alertBodyLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "callout",
        variant,
        body: alertBodyLines.join("\n").trim(),
      });
      continue;
    }

    // Grid block syntax: :::grid
    if (trimmed.startsWith(":::grid")) {
      const cards: { title?: string; body: string }[] = [];
      i++;
      let currentCardTitle: string | undefined = undefined;
      let currentCardBody: string[] = [];
      let inCard = false;

      while (i < lines.length && lines[i].trim() !== ":::") {
        const subLine = lines[i].trim();
        if (subLine.startsWith(":::card")) {
          if (inCard) {
            cards.push({ title: currentCardTitle, body: currentCardBody.join("\n").trim() });
            currentCardBody = [];
            currentCardTitle = undefined;
          }
          const titleMatch = subLine.match(/:::card(?:\s+(.+))?/);
          currentCardTitle = titleMatch?.[1]?.trim();
          inCard = true;
        } else if (inCard) {
          currentCardBody.push(lines[i]);
        }
        i++;
      }
      if (inCard) {
        cards.push({ title: currentCardTitle, body: currentCardBody.join("\n").trim() });
      }
      if (i < lines.length && lines[i].trim() === ":::") {
        i++; // skip closing :::
      }
      if (cards.length > 0) {
        blocks.push({ type: "grid", cards });
      }
      continue;
    }

    // Quote syntax: :::quote[Author] or standard markdown blockquote > ...
    if (trimmed.startsWith(":::quote")) {
      const match = trimmed.match(/:::quote(?:\[(.*?)\])?/);
      const author = match?.[1]?.trim();
      const quoteLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(":::")) {
        quoteLines.push(lines[i]);
        i++;
      }
      if (i < lines.length && lines[i].trim().startsWith(":::")) {
        i++;
      }
      blocks.push({
        type: "quote",
        text: quoteLines.join("\n").trim(),
        author,
      });
      continue;
    }

    // Standard blockquote: > "..." - Forfatter
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().replace(/^>\s+/, ""));
        i++;
      }
      const fullQuote = quoteLines.join(" ");
      const authorSplit = fullQuote.split(/—|--|- /);
      if (authorSplit.length > 1) {
        blocks.push({
          type: "quote",
          text: authorSplit[0].trim().replace(/^["“']|["”']$/g, ""),
          author: authorSplit.slice(1).join("-").trim(),
        });
      } else {
        blocks.push({
          type: "quote",
          text: fullQuote.replace(/^["“']|["”']$/g, ""),
        });
      }
      continue;
    }

    // CTA Button syntax: :::cta[Label](url) or [Knapp: Label](url)
    const ctaMatch =
      trimmed.match(/:::cta\[(.*?)\]\((.*?)\)/) ||
      trimmed.match(/^\[(?:Knapp|Handling|CTA):\s*(.*?)\]\((.*?)\)/i);
    if (ctaMatch) {
      blocks.push({
        type: "cta",
        label: ctaMatch[1].trim(),
        url: ctaMatch[2].trim(),
        primary: true,
      });
      i++;
      continue;
    }

    // Person / Stab / Lederskap grid block: :::personer[filter] or :::stab or :::lederskap
    if (trimmed.startsWith(":::personer") || trimmed.startsWith(":::stab") || trimmed.startsWith(":::lederskap")) {
      let filter = "stab";
      if (trimmed.startsWith(":::lederskap")) filter = "lederskap";
      const match = trimmed.match(/^:::(?:personer|stab|lederskap)(?:\[(.*?)\])?/);
      if (match && match[1]) {
        filter = match[1].trim();
      }
      i++;
      if (i < lines.length && lines[i].trim() === ":::") {
        i++;
      }
      blocks.push({
        type: "person-grid",
        filter,
      });
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "heading", level: 3, text: trimmed.replace("### ", "") });
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "heading", level: 2, text: trimmed.replace("## ", "") });
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "heading", level: 1, text: trimmed.replace("# ", "") });
      i++;
      continue;
    }

    // Unordered lists (- or *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", items, ordered: false });
      continue;
    }

    // Ordered lists (1. 2.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ type: "list", items, ordered: true });
      continue;
    }

    // Default: Regular paragraph
    blocks.push({ type: "paragraph", text: trimmed });
    i++;
  }

  return blocks;
}
