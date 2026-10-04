import React, { useState } from "react";
import {
  VisualBlock,
  DYNAMIC_MODULES_META,
  DynamicModuleType,
} from "../../../../utils/cmsBlocks";
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Edit3,
  Check,
  Calendar,
  Layers,
  Sparkles,
  LayoutGrid,
  FileText,
  Quote,
  Image,
  Info,
  Users,
  Heart,
  Headphones,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";

interface VisualBlockManagerProps {
  blocks: VisualBlock[];
  onChange: (blocks: VisualBlock[]) => void;
  onOpenBlockPicker: () => void;
}

export const VisualBlockManager: React.FC<VisualBlockManagerProps> = ({
  blocks,
  onChange,
  onOpenBlockPicker,
}) => {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editTextBuffer, setEditTextBuffer] = useState<string>("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const next = [...blocks];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  const handleMoveDown = (index: number) => {
    if (index >= blocks.length - 1) return;
    const next = [...blocks];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    onChange(next);
  };

  const handleToggleHide = (index: number) => {
    const next = [...blocks];
    next[index] = {
      ...next[index],
      hidden: !next[index].hidden,
    };
    onChange(next);
  };

  const handleDelete = (index: number) => {
    const next = blocks.filter((_, i) => i !== index);
    onChange(next);
  };

  const handleVariantChange = (index: number, variant: string) => {
    const next = [...blocks];
    next[index] = {
      ...next[index],
      variant,
    };
    onChange(next);
  };

  const handleStartEditContent = (block: VisualBlock) => {
    setEditingBlockId(block.id);
    setEditTextBuffer(block.rawContent || "");
  };

  const handleSaveEditContent = (index: number) => {
    const next = [...blocks];
    next[index] = {
      ...next[index],
      rawContent: editTextBuffer,
    };
    onChange(next);
    setEditingBlockId(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const next = [...blocks];
    const [movedBlock] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, movedBlock);

    onChange(next);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getModuleIcon = (type: string) => {
    switch (type) {
      case "module-worship":
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case "module-calendar":
        return <Calendar className="w-4 h-4 text-sky-400" />;
      case "module-news":
        return <FileText className="w-4 h-4 text-emerald-400" />;
      case "module-sermon":
        return <Headphones className="w-4 h-4 text-pink-400" />;
      case "module-groups":
        return <Users className="w-4 h-4 text-indigo-400" />;
      case "module-giving":
        return <Heart className="w-4 h-4 text-rose-400" />;
      case "grid":
        return <LayoutGrid className="w-4 h-4 text-emerald-400" />;
      case "media-left":
      case "media-right":
        return <Image className="w-4 h-4 text-indigo-400" />;
      case "quote":
        return <Quote className="w-4 h-4 text-amber-400" />;
      case "callout":
        return <Info className="w-4 h-4 text-sky-400" />;
      case "person-grid":
        return <Users className="w-4 h-4 text-primary-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Innholdsblokker & Moduler på siden
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span>⠿ Dra & slipp for å endre rekkefølge</span>
          <span>·</span>
          <span>
            {blocks.filter((b) => !b.hidden).length} synlige av {blocks.length}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {blocks.map((block, index) => {
          const isDynamic = block.isDynamic;
          const isHidden = block.hidden === true;
          const dynamicMeta = isDynamic
            ? DYNAMIC_MODULES_META[block.type as DynamicModuleType]
            : null;
          const isEditing = editingBlockId === block.id;
          const isBeingDragged = draggedIndex === index;
          const isDragTarget = dragOverIndex === index;

          return (
            <div
              key={block.id || index}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`p-3.5 rounded-xl border transition-all ${
                isDragTarget ? "border-indigo-400 ring-2 ring-indigo-500/50 bg-slate-800" : ""
              } ${isBeingDragged ? "opacity-40" : ""} ${
                isHidden
                  ? "bg-slate-950/70 border-dashed border-slate-700 opacity-60"
                  : isDynamic
                  ? "bg-slate-900/90 border-indigo-700/60 hover:border-indigo-500 shadow-sm"
                  : "bg-slate-900/70 border-slate-700 hover:border-slate-600"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left: Drag handle + Info & Badges */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className="p-1 cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 mt-1 shrink-0"
                    title="Klikk og dra for å flytte blokk"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isDynamic
                        ? "bg-indigo-950/80 border border-indigo-800"
                        : "bg-slate-800 border border-slate-700"
                    }`}
                  >
                    {getModuleIcon(block.type)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-bold text-xs truncate ${isHidden ? "line-through text-slate-400" : "text-white"}`}>
                        {block.title}
                      </span>

                      {isHidden && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 border border-amber-700 text-amber-300 flex items-center gap-1">
                          <EyeOff className="w-2.5 h-2.5 text-amber-400" />
                          <span>Skjult på nettsiden</span>
                        </span>
                      )}

                      {isDynamic ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950 border border-indigo-700 text-indigo-300 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                          <span>⚡ Dynamisk modul</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-emerald-300">
                          📝 Statisk innhold
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug truncate">
                      {isDynamic && dynamicMeta
                        ? `Datakilde: ${dynamicMeta.dataSource}`
                        : block.rawContent
                        ? block.rawContent.split("\n")[0].replace(/^#+\s*/, "")
                        : "Tom innholdsblokk"}
                    </p>
                  </div>
                </div>

                {/* Right: Controls (Variant Selector + Vis/Skjul + Up/Down/Delete) */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  {/* Layout variant dropdown for dynamic modules */}
                  {isDynamic && dynamicMeta?.supportedVariants && (
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 hidden xl:inline">Visning:</span>
                      <select
                        value={block.variant || dynamicMeta.supportedVariants[0].id}
                        onChange={(e) => handleVariantChange(index, e.target.value)}
                        className="bg-transparent text-indigo-300 text-xs font-semibold focus:outline-hidden cursor-pointer"
                        title="Velg godkjent layoutvariant for denne modulen"
                      >
                        {dynamicMeta.supportedVariants.map((v) => (
                          <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Edit button for static content */}
                  {!isDynamic && (
                    <button
                      type="button"
                      onClick={() =>
                        isEditing
                          ? handleSaveEditContent(index)
                          : handleStartEditContent(block)
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isEditing
                          ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                      }`}
                      title={isEditing ? "Ferdig med redigering" : "Rediger innhold"}
                    >
                      {isEditing ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Ferdig</span>
                        </>
                      ) : (
                        <>
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Rediger innhold</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Vis / Skjul toggle button */}
                  <button
                    type="button"
                    onClick={() => handleToggleHide(index)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                      isHidden
                        ? "bg-amber-950/70 border-amber-700 text-amber-300 hover:bg-amber-900"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700"
                    }`}
                    title={isHidden ? "Gjør blokken synlig på nettsiden" : "Skjul blokken midlertidig"}
                    aria-label={isHidden ? "Vis blokk" : "Skjul blokk"}
                  >
                    {isHidden ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                  </button>

                  {/* Up button */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveUp(index)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Flytt opp"
                    aria-label="Flytt opp"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>

                  {/* Down button */}
                  <button
                    type="button"
                    disabled={index === blocks.length - 1}
                    onClick={() => handleMoveDown(index)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="Flytt ned"
                    aria-label="Flytt ned"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-800/80 transition-colors cursor-pointer"
                    title="Fjern blokk permanent fra siden"
                    aria-label="Fjern blokk"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Inline editor when expanding a static block */}
              {isEditing && (
                <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300">
                      Rediger tekst / Markdown for denne blokken:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveEditContent(index)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      Bruk endringer
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={editTextBuffer}
                    onChange={(e) => setEditTextBuffer(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500 leading-relaxed"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Button to add new block */}
      <button
        type="button"
        onClick={onOpenBlockPicker}
        className="w-full py-3 px-4 rounded-xl border border-dashed border-indigo-700/80 hover:border-indigo-500 bg-indigo-950/30 hover:bg-indigo-950/60 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
      >
        <Plus className="w-4 h-4 text-indigo-400" />
        <span>+ Legg til blokk eller modul</span>
      </button>
    </div>
  );
};
