/**
 * Utility for handling and client-side compressing image uploads for CMS pages.
 * Ensures image strings remain lightweight for Firestore document storage (< 200KB)
 * while preserving crisp display quality on desktop and mobile viewports.
 */

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
}

/** Keep hero images small enough for Firestore page documents. */
export const MAX_HERO_IMAGE_BYTES = 200 * 1024;

function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

/**
 * Resizes and compresses an image File or Blob to an optimized JPEG data URL.
 */
export function compressImageFile(
  file: File | Blob,
  options: CompressionOptions = {}
): Promise<string> {
  const { maxDimension = 1400, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Den valgte filen er ikke et gyldig bilde."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Kunne ikke lese bildefilen."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Kunne ikke dekode bildet."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Downscale while preserving aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Draw image smoothed
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
        while (dataUrlByteSize(dataUrl) > MAX_HERO_IMAGE_BYTES && currentQuality > 0.35) {
          currentQuality -= 0.08;
          dataUrl = canvas.toDataURL("image/jpeg", currentQuality);
        }
        if (dataUrlByteSize(dataUrl) > MAX_HERO_IMAGE_BYTES) {
          reject(
            new Error(
              "Bildet er fortsatt for stort etter komprimering. Prøv et mindre bilde eller lavere oppløsning."
            )
          );
          return;
        }
        resolve(dataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Curated preset church hero banner photos for fast editorial testing and default layouts.
 */
export const CHURCH_HERO_PRESETS = [
  {
    name: "Lys kirkebenk & fellesskap",
    url: "https://images.unsplash.com/photo-1438032005730-c779502df39b?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Lovsang & samling",
    url: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Kaffeprat & velkomst",
    url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Familie & søndagsskole",
    url: "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=1400&q=80",
  },
  {
    name: "Sørlandsidyll & natur",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80",
  },
];
