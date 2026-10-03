import { describe } from "vitest";
import { assert } from "./assert";
import { MAX_PICTURE_BYTES, getYouTubeVideoId, isPictureTooLarge, parseMessageContent } from "../src/utils/chatMessage";

const texts = (c: string) => parseMessageContent(c).parts.map((p) => p.text);
const links = (c: string) => parseMessageContent(c).parts.filter((p) => p.isLink).map((p) => p.text);
const videos = (c: string) => parseMessageContent(c).videos.map((v) => `${v.videoId}@${v.url}`);

describe("Samtalerommet: YouTube-lenker", () => {
  assert(getYouTubeVideoId("https://www.youtube.com/watch?v=abc123") === "abc123", "Vanlig lenke gir id");
  assert(getYouTubeVideoId("https://youtube.com/watch?v=abc123&t=5") === "abc123", "Ekstra parametere påvirker ikke id-en");
  assert(getYouTubeVideoId("https://youtu.be/xyz789") === "xyz789", "Kort lenke gir id");
  assert(getYouTubeVideoId("https://www.youtube.com/feed") === null, "YouTube-side uten video gir ingen id");
  assert(getYouTubeVideoId("https://example.com/watch?v=abc") === null, "Andre nettsteder gir ingen id");
  assert(getYouTubeVideoId("ikke en lenke") === null, "Tekst som ikke er en lenke gir ingen id");
  assert(getYouTubeVideoId("") === null, "Tom tekst gir ingen id");
});

describe("Samtalerommet: lenker i en melding", () => {
  assert(texts("Hei alle sammen").join("|") === "Hei alle sammen" && links("Hei alle sammen").length === 0, "Tekst uten lenker er én del");
  assert(texts("Se https://a.no/x og https://b.no").join("") === "Se https://a.no/x og https://b.no", "Setter man delene sammen, får man meldingen tilbake");
  assert(links("Se https://a.no/x og https://b.no").join(" ") === "https://a.no/x https://b.no", "Begge lenkene er merket som lenker");
  assert(links("http://a.no og https://b.no").length === 2, "Både http og https");
  assert(links("ftp://a.no og www.b.no").length === 0, "Bare http og https regnes som lenker");
  assert(links("Takk https://a.no/to, og så videre").join() === "https://a.no/to,", "Lenken tar med tegn helt til neste mellomrom, også komma");
  assert(texts("Linje 1\nhttps://a.no\nLinje 2").join("").includes("\n"), "Linjeskift bevares");
  assert(texts("").join("") === "" && videos("").length === 0, "Tom melding gir ingen deler og ingen video");
  assert(parseMessageContent("https://a.no").parts.filter((p) => p.isLink).length === 1, "En melding som bare er en lenke");
});

describe("Samtalerommet: videokort", () => {
  assert(videos("Se https://youtu.be/xyz789").join() === "xyz789@https://youtu.be/xyz789", "Én video, med lenken");
  assert(videos("https://www.youtube.com/watch?v=a og https://youtu.be/b").map((v) => v.split("@")[0]).join() === "a,b", "To videoer i den rekkefølgen de står");
  assert(videos("https://www.youtube.com/watch?v=a og https://www.youtube.com/watch?v=a").length === 1, "Samme lenke to ganger gir ett kort");
  assert(videos("https://www.youtube.com/feed og https://example.com").length === 0, "Lenker uten video gir ingen kort");
  assert(links("https://www.youtube.com/watch?v=a og https://www.youtube.com/watch?v=a").length === 2, "Begge forekomstene er fortsatt lenker i teksten");
});

describe("Samtalerommet: bilder", () => {
  assert(MAX_PICTURE_BYTES === 5 * 1024 * 1024, "Grensen er 5 MB");
  assert(!isPictureTooLarge(0) && !isPictureTooLarge(MAX_PICTURE_BYTES), "Akkurat 5 MB er greit");
  assert(isPictureTooLarge(MAX_PICTURE_BYTES + 1), "Én byte over er for stort");
});
