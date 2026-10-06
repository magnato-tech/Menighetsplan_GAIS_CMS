// The images that come with the app: stock photos picked for congregation websites, and the
// congregation's own, scaled and described, lying as files in public/bildebibliotek/ with
// index.json listing them. They need no image store and are the same whichever congregation's
// website is in the database. A page that uses one stores its address («/bildebibliotek/…jpg»),
// like any other image address.

const FOLDER = "/bildebibliotek";

export interface StockImage {
  id: string;
  title: string;
  /** What the image shows, for screen readers. */
  altText: string;
  tags: string[];
  file: string;
  /** A small version for overviews. */
  thumb: string;
  width: number;
  height: number;
  /** The photographer, as named where the image was found. Empty for an own image nobody is named for. */
  credit: string;
  /** Where the image is from: «Pixabay», «Unsplash» or «Egne bilder». */
  source: string;
  /** The page the image was found on. An image of the congregation's own has none. */
  sourceUrl?: string;
}

const isFileName = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]+\.jpg$/.test(value);

const isStockImage = (value: unknown): value is StockImage => {
  const image = value as Partial<StockImage> | null;
  return (
    !!image &&
    typeof image.id === "string" &&
    typeof image.title === "string" &&
    typeof image.altText === "string" &&
    Array.isArray(image.tags) &&
    image.tags.every((tag) => typeof tag === "string") &&
    // The files are fetched from the folder, so the names can be nothing but file names
    isFileName(image.file) &&
    isFileName(image.thumb) &&
    typeof image.width === "number" &&
    typeof image.height === "number" &&
    typeof image.credit === "string" &&
    typeof image.source === "string" &&
    (image.sourceUrl === undefined || (typeof image.sourceUrl === "string" && image.sourceUrl.startsWith("https://")))
  );
};

/** The address a page stores to show the image. */
export const stockImageUrl = (image: Pick<StockImage, "file">): string => `${FOLDER}/${image.file}`;
export const stockThumbUrl = (image: Pick<StockImage, "thumb">): string => `${FOLDER}/${image.thumb}`;

/** The images that come with the app. Throws when the list cannot be fetched or is not a list. */
export async function listStockImages(): Promise<StockImage[]> {
  const response = await fetch(`${FOLDER}/index.json`);
  if (!response.ok) throw new Error(`Bildene som følger med, kunne ikke hentes (${response.status}).`);
  const list: unknown = await response.json();
  if (!Array.isArray(list)) throw new Error("Listen over bildene som følger med, har et ukjent format.");
  return list.filter(isStockImage);
}

/** The images whose title, description or tags hold every word searched for. */
export function filterStockImages(images: StockImage[], query: string): StockImage[] {
  const words = query.toLocaleLowerCase("nb").split(/\s+/).filter(Boolean);
  if (words.length === 0) return images;
  return images.filter((image) => {
    const text = [image.title, image.altText, ...image.tags].join(" ").toLocaleLowerCase("nb");
    return words.every((word) => text.includes(word));
  });
}
