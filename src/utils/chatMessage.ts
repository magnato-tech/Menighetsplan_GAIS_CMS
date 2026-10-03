const URL_PATTERN = /https?:\/\/[^\s]+/;
// The capturing group makes split() keep the links, at every other place in the result
const SPLIT_ON_URL = /(https?:\/\/[^\s]+)/;

/** The biggest picture that can be attached to a message. */
export const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

export function isPictureTooLarge(sizeInBytes: number): boolean {
  return sizeInBytes > MAX_PICTURE_BYTES;
}

/** The video id of a YouTube link (youtube.com/watch?v=… or youtu.be/…), or null for anything else. */
export function getYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v");
    if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
    return null;
  } catch {
    return null;
  }
}

export interface MessagePart {
  text: string;
  isLink: boolean;
}

export interface MessageContent {
  /** The text in order, cut at every link */
  parts: MessagePart[];
  /** Each YouTube link once, in the order they appear, for the video cards under the text */
  videos: { url: string; videoId: string }[];
}

/** Cuts a message at its links and picks out the YouTube links. */
export function parseMessageContent(content: string): MessageContent {
  const videos: MessageContent["videos"] = [];
  const parts = content.split(SPLIT_ON_URL).map((text) => {
    const isLink = URL_PATTERN.test(text);
    if (isLink) {
      const videoId = getYouTubeVideoId(text);
      if (videoId && !videos.some((v) => v.url === text)) videos.push({ url: text, videoId });
    }
    return { text, isLink };
  });
  return { parts, videos };
}
