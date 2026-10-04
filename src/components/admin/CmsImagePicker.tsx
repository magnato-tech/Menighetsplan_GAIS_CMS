import React, { useRef, useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Check,
  AlertCircle,
} from "lucide-react";
import { compressImageFile, CHURCH_HERO_PRESETS } from "../../utils/imageUpload";

interface CmsImagePickerProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  helpText?: string;
  compact?: boolean;
}

export const CmsImagePicker: React.FC<CmsImagePickerProps> = ({
  label,
  value,
  onChange,
  helpText,
  compact = true,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showPresets, setShowPresets] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Vennligst velg en gyldig bildefil (JPG, PNG, WebP).");
      return;
    }
    try {
      setIsUploading(true);
      const compressedDataUrl = await compressImageFile(file, {
        maxDimension: compact ? 1200 : 1400,
        quality: 0.82,
      });
      onChange(compressedDataUrl);
      setShowUrlInput(false);
      setShowPresets(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Kunne ikke laste opp bildet.";
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (
      !trimmed.startsWith("http://") &&
      !trimmed.startsWith("https://") &&
      !trimmed.startsWith("data:")
    ) {
      setErrorMessage("Nettadressen må starte med https:// eller http://");
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

      {errorMessage && (
        <div className="p-2 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-[10px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-slate-950 h-28">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-slate-950/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-semibold cursor-pointer"
            >
              Bytt bilde
            </button>
          </div>
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-slate-900/90 text-emerald-400 text-[9px] font-bold flex items-center gap-0.5">
            <Check className="w-2.5 h-2.5" />
            <span>Lagret</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleProcessFile(file);
          }}
          className={`border border-dashed rounded-lg p-3 text-center transition-all ${
            isDragging ? "border-indigo-400 bg-indigo-950/40" : "border-slate-700 bg-slate-950/50"
          }`}
        >
          {isUploading ? (
            <div className="py-2 text-[10px] text-indigo-300">Komprimerer bilde...</div>
          ) : (
            <div className="space-y-2">
              <ImageIcon className="w-5 h-5 text-slate-500 mx-auto" />
              <div className="flex flex-wrap justify-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 rounded bg-slate-800 text-slate-200 text-[10px] font-medium cursor-pointer flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Last opp</span>
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
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProcessFile(file);
          e.target.value = "";
        }}
        className="hidden"
      />

      {showUrlInput && (
        <form onSubmit={handleApplyUrl} className="flex items-center gap-1.5">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="flex-1 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-[10px] font-mono"
          />
          <button type="submit" className="px-2 py-1.5 rounded-lg bg-indigo-600 text-white text-[10px] font-semibold cursor-pointer">
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
    </div>
  );
};
