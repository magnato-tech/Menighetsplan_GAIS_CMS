/**
 * Builds source, web, thumb and og image blobs from an uploaded file.
 */

import { MAX_HERO_IMAGE_BYTES } from "./imageUpload";

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface MediaVariantBlobs {
  source: Blob;
  web: Blob;
  thumb: Blob;
  og: Blob;
  width: number;
  height: number;
}

function dataUrlByteSize(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function loadImageFromFile(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Kunne ikke lese bildefilen."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Kunne ikke dekode bildet."));
      img.onload = () => resolve(img);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function canvasToJpegBlob(
  canvas: HTMLCanvasElement,
  quality = 0.82,
  maxBytes = MAX_HERO_IMAGE_BYTES
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let currentQuality = quality;
    const tryEncode = () => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Kunne ikke komprimere bildet."));
            return;
          }
          if (blob.size > maxBytes && currentQuality > 0.35) {
            currentQuality -= 0.08;
            tryEncode();
            return;
          }
          if (blob.size > maxBytes) {
            reject(new Error("Bildet er fortsatt for stort etter komprimering."));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        currentQuality
      );
    };
    tryEncode();
  });
}

function drawScaled(
  img: HTMLImageElement,
  maxDimension: number,
  crop?: { width: number; height: number }
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kunne ikke tegne bildet.");

  let sourceX = 0;
  let sourceY = 0;
  let sourceW = img.width;
  let sourceH = img.height;

  if (crop) {
    const targetRatio = crop.width / crop.height;
    const sourceRatio = img.width / img.height;
    if (sourceRatio > targetRatio) {
      sourceH = img.height;
      sourceW = Math.round(img.height * targetRatio);
      sourceX = Math.round((img.width - sourceW) / 2);
    } else {
      sourceW = img.width;
      sourceH = Math.round(img.width / targetRatio);
      sourceY = Math.round((img.height - sourceH) / 2);
    }
    canvas.width = crop.width;
    canvas.height = crop.height;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, crop.width, crop.height);
    return canvas;
  }

  let width = img.width;
  let height = img.height;
  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }
  canvas.width = width;
  canvas.height = height;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

/** Builds all storage variants from a user-selected image file. */
export async function buildMediaVariantBlobs(file: File): Promise<MediaVariantBlobs> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Den valgte filen er ikke et gyldig bilde.");
  }

  const img = await loadImageFromFile(file);
  const sourceCanvas = drawScaled(img, Math.max(img.width, img.height));
  const source = await canvasToJpegBlob(sourceCanvas, 0.92, 8 * 1024 * 1024);
  const web = await canvasToJpegBlob(drawScaled(img, 1400));
  const thumb = await canvasToJpegBlob(drawScaled(img, 400), 0.8, 80 * 1024);
  const og = await canvasToJpegBlob(drawScaled(img, 1400, { width: 1200, height: 630 }), 0.85);

  return {
    source,
    web,
    thumb,
    og,
    width: img.width,
    height: img.height,
  };
}

/** For tests without canvas: approximate byte size check helper. */
export function isWithinByteLimit(dataUrl: string, maxBytes: number): boolean {
  return dataUrlByteSize(dataUrl) <= maxBytes;
}
