import React, { useMemo, useRef, useState } from "react";
import {
  Archive,
  Check,
  Image as ImageIcon,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useCms } from "../../context/CmsContext";
import type { CmsMedia } from "../../data/cmsData";
import { pickMediaPreviewUrl } from "../../services/mediaStorage";
import { filterMediaLibrary, toMediaRef } from "../../utils/media";

interface MediaLibraryPanelProps {
  onSelect?: (ref: string, item: CmsMedia) => void;
  selectedRef?: string;
  compact?: boolean;
}

export const MediaLibraryPanel: React.FC<MediaLibraryPanelProps> = ({
  onSelect,
  selectedRef,
  compact = false,
}) => {
  const { media, uploadMedia, updateMedia, archiveMedia, deleteMedia, getMediaUsages } = useCms();
  const [query, setQuery] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadAlt, setUploadAlt] = useState("");
  const [uploadTags, setUploadTags] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => filterMediaLibrary(media, query, includeArchived),
    [media, query, includeArchived]
  );

  const active = activeId ? media.find((item) => item.id === activeId) : null;
  const usages = active ? getMediaUsages(active.id) : [];

  const handleUpload = async (file: File) => {
    setError(null);
    if (!uploadAlt.trim()) {
      setError("Standardtekst for skjermleser er påkrevd ved opplasting.");
      return;
    }
    setUploading(true);
    const uploaded = await uploadMedia(file, {
      title: uploadTitle.trim() || file.name.replace(/\.[^.]+$/, ""),
      altText: uploadAlt.trim(),
      tags: uploadTags.split(",").map((tag) => tag.trim()).filter(Boolean),
    });
    setUploading(false);
    if (!uploaded) {
      setError("Opplastingen feilet. Prøv igjen.");
      return;
    }
    setUploadTitle("");
    setUploadAlt("");
    setUploadTags("");
    setActiveId(uploaded.id);
  };

  const handleDelete = async (item: CmsMedia) => {
    const result = await deleteMedia(item.id);
    if (result.blockedByUsages) {
      setError("Bildet kan ikke slettes fordi det brukes i innhold.");
      return;
    }
    if (result.ok && activeId === item.id) setActiveId(null);
  };

  return (
    <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]"}`}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk i tittel, alt-tekst eller emneord..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>
          <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="rounded"
            />
            <span>Vis arkiverte</span>
          </label>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3 space-y-2">
          <div className="text-[11px] font-semibold text-slate-300">Last opp nytt bilde</div>
          <p className="text-[10px] text-slate-500">
            Filen lagres med en offentlig adresse som alle med lenken kan hente.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="Tittel i biblioteket"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
            />
            <input
              value={uploadAlt}
              onChange={(e) => setUploadAlt(e.target.value)}
              placeholder="Standardtekst for skjermleser (påkrevd)"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
            />
            <input
              value={uploadTags}
              onChange={(e) => setUploadTags(e.target.value)}
              placeholder="Emneord, kommaseparert"
              className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs sm:col-span-2"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? "Laster opp..." : "Velg fil og last opp"}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        {error && (
          <div className="text-[11px] text-red-300 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 max-h-[52vh] overflow-y-auto pr-1">
          {filtered.map((item) => {
            const ref = toMediaRef(item.id);
            const preview = pickMediaPreviewUrl(item);
            const isSelected = selectedRef === ref;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveId(item.id);
                  onSelect?.(ref, item);
                }}
                className={`relative rounded-lg overflow-hidden border aspect-video cursor-pointer text-left ${
                  isSelected || activeId === item.id
                    ? "border-indigo-400 ring-2 ring-indigo-500/40"
                    : "border-slate-700 hover:border-slate-500"
                }`}
              >
                {preview ? (
                  <img src={preview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-slate-600" />
                  </div>
                )}
                {item.status === "archived" && (
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-[9px] text-amber-300 font-bold">
                    Arkivert
                  </span>
                )}
                {isSelected && (
                  <span className="absolute top-1 right-1 p-1 rounded-full bg-emerald-600 text-white">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-xs text-slate-500 py-8">
              Ingen bilder funnet.
            </div>
          )}
        </div>
      </div>

      {active && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-bold text-white">{active.title}</div>
              <div className="text-[10px] text-slate-500">{active.width}×{active.height}px</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveId(null)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <img
            src={active.variants.web || pickMediaPreviewUrl(active)}
            alt={active.altText}
            className="w-full rounded-lg border border-slate-700 object-cover max-h-48"
          />
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold text-slate-400">Tittel</span>
            <input
              value={active.title}
              onChange={(e) => void updateMedia(active.id, { title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold text-slate-400">Standardtekst for skjermleser</span>
            <input
              value={active.altText}
              onChange={(e) => void updateMedia(active.id, { altText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-[10px] font-semibold text-slate-400">Emneord</span>
            <input
              value={active.tags.join(", ")}
              onChange={(e) =>
                void updateMedia(active.id, {
                  tags: e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean),
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </label>
          <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={active.approvedForAi}
              onChange={(e) => void updateMedia(active.id, { approvedForAi: e.target.checked })}
            />
            <span>Godkjent for AI-søk senere</span>
          </label>

          <div className="space-y-1">
            <div className="text-[10px] font-semibold text-slate-400">Hvor brukes dette?</div>
            {usages.length === 0 ? (
              <p className="text-[11px] text-slate-500">Ikke i bruk i lagret innhold.</p>
            ) : (
              <ul className="text-[11px] text-slate-300 space-y-1 max-h-28 overflow-y-auto">
                {usages.map((usage) => (
                  <li key={`${usage.type}-${usage.id}-${usage.label}`}>• {usage.label}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {onSelect && active.status === "ready" && (
              <button
                type="button"
                onClick={() => onSelect(toMediaRef(active.id), active)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Bruk dette bildet
              </button>
            )}
            {active.status === "ready" ? (
              <button
                type="button"
                onClick={() => void archiveMedia(active.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Arkiver</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void updateMedia(active.id, { status: "ready" })}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Gjenopprett
              </button>
            )}
            <button
              type="button"
              onClick={() => void handleDelete(active)}
              className="px-3 py-1.5 rounded-lg bg-red-950 text-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Slett permanent</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
