import { useMemo } from "react";
import { useCms } from "../context/CmsContext";
import { mediaMapFromList, resolveMediaUrl, type MediaVariant } from "../utils/media";

export function useMediaMap(): Record<string, import("../data/cmsData").CmsMedia> {
  const { media } = useCms();
  return useMemo(() => mediaMapFromList(media), [media]);
}

export function useResolvedMediaUrl(
  value: string | undefined | null,
  variant: MediaVariant = "web"
): string {
  const mediaById = useMediaMap();
  return resolveMediaUrl(value, mediaById, variant);
}
