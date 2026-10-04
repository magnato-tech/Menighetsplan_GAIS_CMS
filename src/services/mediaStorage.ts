import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "../firebase";
import type { CmsMedia, CmsMediaVariants } from "../data/cmsData";
import type { MediaVariantBlobs } from "../utils/imageVariants";

const VARIANT_FILES = {
  source: "source.jpg",
  web: "web.jpg",
  thumb: "thumb.jpg",
  og: "og.jpg",
} as const;

function mediaPath(mediaId: string, fileName: string): string {
  return `media/${mediaId}/${fileName}`;
}

async function uploadVariant(mediaId: string, fileName: string, blob: Blob): Promise<string> {
  const storageRef = ref(storage, mediaPath(mediaId, fileName));
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}

/** Uploads all image variants and returns their public download URLs. */
export async function uploadMediaVariants(
  mediaId: string,
  blobs: MediaVariantBlobs
): Promise<{ variants: CmsMediaVariants; sourcePath: string; byteSize: number }> {
  const [, web, thumb, og] = await Promise.all([
    uploadVariant(mediaId, VARIANT_FILES.source, blobs.source),
    uploadVariant(mediaId, VARIANT_FILES.web, blobs.web),
    uploadVariant(mediaId, VARIANT_FILES.thumb, blobs.thumb),
    uploadVariant(mediaId, VARIANT_FILES.og, blobs.og),
  ]);

  return {
    sourcePath: mediaPath(mediaId, VARIANT_FILES.source),
    byteSize: blobs.source.size,
    variants: { web, thumb, og },
  };
}

export async function deleteMediaStorageFiles(mediaId: string): Promise<void> {
  const names = Object.values(VARIANT_FILES);
  await Promise.all(
    names.map(async (fileName) => {
      try {
        await deleteObject(ref(storage, mediaPath(mediaId, fileName)));
      } catch {
        // Missing file is fine during cleanup
      }
    })
  );
}

export function pickMediaPreviewUrl(item: CmsMedia): string {
  return item.variants.thumb || item.variants.web || "";
}
