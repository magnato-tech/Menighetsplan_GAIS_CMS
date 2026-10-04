import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  FolderOpen,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { CHURCH_HERO_PRESETS } from "../../utils/imageUpload";
import { useResolvedMediaUrl } from "../../hooks/useMediaMap";
import { MediaLibraryPanel } from "./MediaLibraryPanel";

interface CmsMediaPickerProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helpText?: string;
  compact?: boolean;
  decorative?: boolean;
  altValue?: string;
  onAltChange?: (alt: string) => void;
}

export const CmsMediaPicker: React.FC<CmsMediaPickerProps> = ({
  label,
  value,
  onChange,
  helpText,
  compact = true,
  decorative = false,
  altValue = "",
  onAltChange,
}) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const previewUrl = useResolvedMediaUrl(value, compact ? "thumb" : "web");

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("data:") &&
      !trimmed.startsWith("media:")
    ) {
      setErrorMessage("Adressen må starte med https://, media: eller data:");
      return;
    }
    setErrorMessage(null);
    onChange(trimmed);
    setUrlInput("");
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold text-slate-400">{label}</span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer"
          >
            Fjern bilde
          </button>
        )}
      </div>
      {helpText && <p className="text-[10px] text-slate-500">{helpText}</p>}

      {decorative && onAltChange && (
        <label className="block space-y-1">
          <span className="text-[10px] text-slate-500">
            Beskrivelse for skjermleser (valgfritt for dekor)
          </span>
          <input
            value={altValue}
            onChange={(e) => onAltChange(e.target.value)}
            placeholder="La stå tom for dekorativt bilde"
            className="w-full px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[10px]"
          />
        </label>
      )}

      {errorMessage && (
        <div className="p-2 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-[10px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {value && previewUrl ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 h-28">
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-emerald-400 text-[9px] font-bold flex items-center gap-0.5">
            <Check className="w-2.5 h-2.5" />
            <span>Valgt</span>
          </div>
        </div>
      ) : (
        <div className="border border-dashed rounded-lg p-3 text-center border-slate-700 bg-slate-950/50 space-y-2">
          <ImageIcon className="w-5 h-5 text-slate-500 mx-auto" />
          <div className="flex flex-wrap justify-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setShowLibrary(true);
                setShowUrlInput(false);
                setShowPresets(false);
              }}
              className="px-2 py-1 rounded bg-indigo-600 text-white text-[10px] font-medium cursor-pointer flex items-center gap-1"
            >
              <FolderOpen className="w-3 h-3" />
              <span>Bibliotek</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUrlInput(!showUrlInput);
                setShowPresets(false);
              }}
              className="px-2 py-1 rounded bg-slate-800 text-slate-200 text-[10px] font-medium cursor-pointer flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              <span>URL</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPresets(!showPresets);
                setShowUrlInput(false);
              }}
              className="px-2 py-1 rounded bg-indigo-950 text-indigo-300 text-[10px] font-medium cursor-pointer flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Kirkebilder</span>
            </button>
          </div>
        </div>
      )}

      {value && (
        <button
          type="button"
          onClick={() => setShowLibrary(true)}
          className="text-[10px] text-indigo-300 hover:text-white cursor-pointer flex items-center gap-1"
        >
          <Upload className="w-3 h-3" />
          <span>Bytt bilde</span>
        </button>
      )}

      {showUrlInput && (
        <form onSubmit={handleApplyUrl} className="flex items-center gap-1.5">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://... eller media:id"
            className="flex-1 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[10px] font-mono"
          />
          <button
            type="submit"
            className="px-2 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-semibold cursor-pointer"
          >
            Bruk
          </button>
        </form>
      )}

      {showPresets && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {CHURCH_HERO_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                onChange(preset.url);
                setShowPresets(false);
              }}
              className="relative rounded overflow-hidden border border-slate-700 hover:border-indigo-500 aspect-video cursor-pointer"
              title={preset.name}
            >
              <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {showLibrary && (
        <div className="fixed inset-0 z-[80] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Mediebibliotek</h3>
              <button
                type="button"
                onClick={() => setShowLibrary(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <MediaLibraryPanel
              selectedRef={value}
              onSelect={(ref) => {
                onChange(ref);
                setShowLibrary(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
