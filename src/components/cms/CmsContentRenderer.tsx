import React from "react";
import { Link } from "react-router-dom";
import { useFirebase } from "../../context/FirebaseDataContext";
import { type PersonGridProfile, selectPersonGrid } from "../../utils/personGrid";
import {
  Info,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  Quote,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
} from "lucide-react";

interface CmsContentRendererProps {
  content?: string;
  className?: string;
}

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

/**
 * Safely parses inline markdown tokens (bold, italics, links, code, mark)
 * Strips script tags and disallows unescaped active vectors.
 */
function renderInlineFormatting(text: string): React.ReactNode {
  // Strip dangerous html tags
  const sanitized = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  // Match links: [text](url)
  const parts: React.ReactNode[] = [];
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(sanitized)) !== null) {
    if (match.index > lastIndex) {
      parts.push(renderSimpleStyles(sanitized.substring(lastIndex, match.index)));
    }
    const label = match[1];
    const url = match[2];
    const isExternal = url.startsWith("http://") || url.startsWith("https://");

    if (isExternal) {
      parts.push(
        <a
          key={`link-${match.index}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-800 underline underline-offset-2 font-medium inline-flex items-center gap-0.5"
        >
          <span>{label}</span>
          <ExternalLink className="w-3 h-3 inline opacity-70" />
        </a>
      );
    } else {
      parts.push(
        <Link
          key={`link-${match.index}`}
          to={url}
          className="text-primary-600 hover:text-primary-800 underline underline-offset-2 font-medium"
        >
          {label}
        </Link>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < sanitized.length) {
    parts.push(renderSimpleStyles(sanitized.substring(lastIndex)));
  }

  return parts.length > 0 ? parts : text;
}

/**
 * Handles bold **text**, italic *text*, `code`, and highlighting
 */
function renderSimpleStyles(str: string): React.ReactNode {
  const parts = str.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-stone-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={idx} className="italic text-stone-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-xs font-mono text-stone-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export const CmsContentRenderer: React.FC<CmsContentRendererProps> = ({
  content = "",
  className = "",
}) => {
  const blocks = parseCmsContent(content);

  return (
    <div className={`cms-prose-sandbox space-y-4 text-stone-800 ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "spacer":
            return <div key={idx} className="h-3" />;

          case "heading": {
            if (block.level === 1) {
              return (
                <h1
                  key={idx}
                  className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight mt-6 mb-2"
                >
                  {renderInlineFormatting(block.text)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight mt-6 mb-2 border-b border-stone-200/60 pb-2"
                >
                  {renderInlineFormatting(block.text)}
                </h2>
              );
            }
            return (
              <h3
                key={idx}
                className="text-lg font-bold text-stone-900 tracking-tight mt-4 mb-1"
              >
                {renderInlineFormatting(block.text)}
              </h3>
            );
          }

          case "paragraph":
            return (
              <p
                key={idx}
                className="text-stone-700 text-sm sm:text-base leading-relaxed my-1.5"
              >
                {renderInlineFormatting(block.text)}
              </p>
            );

          case "list":
            if (block.ordered) {
              return (
                <ol
                  key={idx}
                  className="list-decimal pl-5 space-y-1 text-sm sm:text-base text-stone-700 leading-relaxed my-2"
                >
                  {block.items.map((item, itemIdx) => (
                    <li key={itemIdx}>{renderInlineFormatting(item)}</li>
                  ))}
                </ol>
              );
            }
            return (
              <ul
                key={idx}
                className="list-disc pl-5 space-y-1 text-sm sm:text-base text-stone-700 leading-relaxed my-2"
              >
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx}>{renderInlineFormatting(item)}</li>
                ))}
              </ul>
            );

          case "callout": {
            const styles = {
              info: {
                bg: "bg-sky-50/80 border-sky-200 text-sky-950",
                icon: <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />,
                title: "Informasjon",
              },
              warning: {
                bg: "bg-amber-50/80 border-amber-200 text-amber-950",
                icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
                title: "Viktig merknad",
              },
              success: {
                bg: "bg-emerald-50/80 border-emerald-200 text-emerald-950",
                icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
                title: "Kunngjøring",
              },
              primary: {
                bg: "bg-primary-50/70 border-primary-200 text-primary-950",
                icon: <Bookmark className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />,
                title: "Fremhevet",
              },
            }[block.variant];

            return (
              <div
                key={idx}
                className={`p-4 sm:p-5 rounded-2xl border ${styles.bg} my-3 flex items-start gap-3.5 shadow-xs`}
              >
                {styles.icon}
                <div className="space-y-1 flex-1 text-sm leading-relaxed">
                  {(block.title || styles.title) && (
                    <div className="font-bold text-xs uppercase tracking-wider opacity-90">
                      {block.title || styles.title}
                    </div>
                  )}
                  <div className="whitespace-pre-line text-sm opacity-95">
                    {renderInlineFormatting(block.body)}
                  </div>
                </div>
              </div>
            );
          }

          case "media": {
            const isLeft = block.alignment === "left";
            return (
              <div
                key={idx}
                className={`my-6 flex flex-col md:flex-row items-center gap-6 p-5 sm:p-6 bg-stone-50 border border-stone-200/80 rounded-2xl shadow-xs ${
                  isLeft ? "" : "md:flex-row-reverse"
                }`}
              >
                {block.imageUrl && (
                  <div className="w-full md:w-5/12 h-48 sm:h-56 md:h-64 rounded-xl overflow-hidden shrink-0 bg-stone-200 border border-stone-300/80 shadow-2xs">
                    <img
                      src={block.imageUrl}
                      alt={block.title || "Illustrasjonsbilde"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2.5 text-stone-700">
                  {block.title && (
                    <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                      {renderInlineFormatting(block.title)}
                    </h3>
                  )}
                  <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line text-stone-600">
                    {renderInlineFormatting(block.body)}
                  </div>
                </div>
              </div>
            );
          }

          case "grid":
            return (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4"
              >
                {block.cards.map((card, cardIdx) => (
                  <div
                    key={cardIdx}
                    className="p-4 sm:p-5 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-2 shadow-xs"
                  >
                    {card.title && (
                      <h4 className="font-bold text-stone-900 text-base">
                        {renderInlineFormatting(card.title)}
                      </h4>
                    )}
                    <div className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                      {renderInlineFormatting(card.body)}
                    </div>
                  </div>
                ))}
              </div>
            );

          case "quote":
            return (
              <div
                key={idx}
                className="relative my-4 pl-5 sm:pl-6 py-2 border-l-4 border-primary-600 bg-stone-50/60 rounded-r-xl"
              >
                <Quote className="w-6 h-6 text-primary-400/40 absolute -top-2 left-2 pointer-events-none" />
                <p className="text-stone-800 italic text-base sm:text-lg leading-relaxed font-serif">
                  «{renderInlineFormatting(block.text)}»
                </p>
                {block.author && (
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mt-1.5">
                    — {block.author}
                  </p>
                )}
              </div>
            );

          case "cta": {
            const isExternal = block.url.startsWith("http://") || block.url.startsWith("https://");
            const btnClass =
              "inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-sm hover:shadow-md transition-all my-2 bg-primary-600 hover:bg-primary-700 cursor-pointer";

            if (isExternal) {
              return (
                <div key={idx} className="my-3">
                  <a
                    href={block.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={btnClass}
                  >
                    <span>{block.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              );
            }
            return (
              <div key={idx} className="my-3">
                <Link to={block.url} className={btnClass}>
                  <span>{block.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            );
          }

          case "person-grid":
            return <PersonGridRenderer key={idx} filter={block.filter} />;

          default:
            return null;
        }
      })}
    </div>
  );
};

interface PersonCardProps {
  profile: PersonGridProfile;
}

const PersonCard: React.FC<PersonCardProps> = ({ profile }) => {
  const title = profile.title || profile.roleInGroup;
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {profile.avatarUrl ? (
          <div className="w-full h-52 sm:h-56 bg-stone-100 overflow-hidden relative">
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-52 sm:h-56 bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-4xl font-black text-stone-400 select-none">
            {profile.name.charAt(0)}
          </div>
        )}

        <div className="p-5 space-y-2">
          <div>
            <h3 className="font-bold text-stone-900 text-lg leading-tight">{profile.name}</h3>
            {title && <p className="text-xs text-primary-700 font-semibold mt-0.5">{title}</p>}
          </div>

          {profile.bio && (
            <p className="text-xs text-stone-600 leading-relaxed pt-1 line-clamp-3">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {(profile.phone || profile.email) && (
        <div className="px-5 pb-5 pt-2 border-t border-stone-100/80 flex flex-col gap-1.5 text-xs text-stone-600">
          {profile.phone && (
            <a
              href={`tel:${profile.phone}`}
              className="inline-flex items-center gap-2 hover:text-stone-900 font-medium transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span>{profile.phone}</span>
            </a>
          )}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 hover:text-stone-900 font-medium truncate transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              <span className="truncate">{profile.email}</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
};

interface PersonGridRendererProps {
  filter: string;
}

const EMPTY_TEXT = {
  group: "Ingen offentlige profiler med registrert samtykke i gruppen ennå.",
  ids: "Ingen profiler funnet for de oppgitte personene.",
  staff: "Ingen stabsmedlemmer med registrert samtykke funnet.",
} as const;

const PersonGridRenderer: React.FC<PersonGridRendererProps> = ({ filter }) => {
  const { allPersons, groups } = useFirebase();
  const result = selectPersonGrid(filter, allPersons, groups);

  if (result.kind !== "people") {
    return (
      <div className="p-4 rounded-xl bg-stone-100 text-stone-500 text-xs italic">
        {result.kind === "no-group" ? "Ingen lederskapsgruppe funnet." : EMPTY_TEXT[result.of]}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 my-6">
      {result.profiles.map((p) => (
        <PersonCard key={p.id} profile={p} />
      ))}
    </div>
  );
};
