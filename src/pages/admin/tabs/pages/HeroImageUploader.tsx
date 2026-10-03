import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  Link as LinkIcon,
  Sparkles,
  Check,
  AlertCircle,
} from "lucide-react";
import { compressImageFile, CHURCH_HERO_PRESETS } from "../../../../utils/imageUpload";

interface HeroImageUploaderProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  pageTitle?: string;
}

export const HeroImageUploader: React.FC<HeroImageUploaderProps> = ({
  currentImageUrl,
  onImageChange,
  pageTitle,
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
        maxDimension: 1400,
        quality: 0.82,
      });
      onImageChange(compressedDataUrl);
      setShowUrlInput(false);
      setShowPresets(false);
    } catch (err: any) {
      setErrorMessage(err.message || "Kunne ikke laste opp bildet.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // Reset file input so re-selecting same file triggers change
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("data:")) {
      setErrorMessage("Nettadressen må starte med https:// eller http://");
      return;
    }
    setErrorMessage(null);
    onImageChange(trimmed);
    setUrlInput("");
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-700/80">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-white flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-indigo-400" />
          <span>Hovedbilde / Toppbanner</span>
          <span className="text-[10px] font-normal text-slate-400">
            (Vises øverst på siden på offentlig nettside)
          </span>
        </label>

        {currentImageUrl && (
          <button
            type="button"
            onClick={() => onImageChange("")}
            className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Fjern hovedbilde</span>
          </button>
        )}
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-red-950/80 border border-red-800 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* If an image is currently set: Display Preview with controls */}
      {currentImageUrl ? (
        <div className="space-y-2">
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 group h-44 sm:h-52 w-full">
            <img
              src={currentImageUrl}
              alt={pageTitle || "Hovedbilde"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Last opp nytt bilde</span>
              </button>
              <button
                type="button"
                onClick={() => onImageChange("")}
                className="px-3 py-1.5 rounded-lg bg-red-900/90 hover:bg-red-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Fjern</span>
              </button>
            </div>
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/90 text-emerald-400 text-[10px] font-bold border border-emerald-800/80 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Hovedbilde lagres med siden</span>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Upload dropzone & options */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition-all ${
            isDragging
              ? "border-indigo-400 bg-indigo-950/40 text-indigo-200"
              : "border-slate-700 bg-slate-900/40 hover:border-slate-600 text-slate-400"
          }`}
        >
          {isUploading ? (
            <div className="py-4 space-y-2">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-indigo-300 font-semibold">
                Komprimerer og klargjør bilde for nettsiden...
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-indigo-400">
                <Upload className="w-5 h-5 text-indigo-400" />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-white">
                  Dra og slipp et bilde her, eller{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-indigo-400 hover:text-indigo-300 underline font-bold cursor-pointer"
                  >
                    bla gjennom filer
                  </button>
                </p>
                <p className="text-[11px] text-slate-500">
                  Støtter JPG, PNG og WebP. Bildet komprimeres automatisk for rask lasting.
                </p>
              </div>

              {/* Action buttons for URL and Presets */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(!showUrlInput);
                    setShowPresets(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Lim inn bildeadresse</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowPresets(!showPresets);
                    setShowUrlInput(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-800/60 font-medium flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Velg fra kirkebilder</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Manual URL input modal/drawer */}
      {showUrlInput && (
        <form onSubmit={handleApplyUrl} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-mono focus:outline-hidden focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Bruk bilde
          </button>
          <button
            type="button"
            onClick={() => setShowUrlInput(false)}
            className="px-2 py-1.5 text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            Avbryt
          </button>
        </form>
      )}

      {/* Preset Church Photos Drawer */}
      {showPresets && (
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Velg et anbefalt forsidebilde for kirken:</span>
            <button
              type="button"
              onClick={() => setShowPresets(false)}
              className="text-slate-400 hover:text-white"
            >
              Lukk ✕
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {CHURCH_HERO_PRESETS.map((preset, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => {
                  onImageChange(preset.url);
                  setShowPresets(false);
                }}
                className="group relative rounded-lg overflow-hidden border border-slate-700 hover:border-indigo-500 bg-slate-950 aspect-video text-left cursor-pointer transition-all shadow-xs"
                title={preset.name}
              >
                <img
                  src={preset.url}
                  alt={preset.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/20 to-transparent p-1.5 flex items-end">
                  <span className="text-[10px] text-white font-medium line-clamp-1 leading-tight">
                    {preset.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
