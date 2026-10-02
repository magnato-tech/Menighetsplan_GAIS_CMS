// Constants for Group Category and Meeting Schedule
export const GROUP_CATEGORIES: { id: "tjenestegruppe" | "husgruppe" | "strategigruppe" | "ledergruppe" | "interessegruppe"; label: string }[] = [
  { id: "ledergruppe", label: "Ledergruppe (Stab, menighetsråd, gruppeledere)" },
  { id: "strategigruppe", label: "Strategigruppe (Vekstgrupper: Bønn, Kommunikasjon, Historie)" },
  { id: "tjenestegruppe", label: "Tjenestegruppe (Lyd, kirkekaffe, søndagsskole)" },
  { id: "husgruppe", label: "Husgruppe (Husfellesskap i hjemmene)" },
  { id: "interessegruppe", label: "Interessegruppe (Turgruppe, kor, hobby, senior)" },
];

export const MEETING_FREQUENCIES: { id: "hver uke" | "annenhver uke" | "hver måned"; label: string }[] = [
  { id: "hver uke", label: "Hver uke" },
  { id: "annenhver uke", label: "Annenhver uke" },
  { id: "hver måned", label: "Hver måned" },
];

export const WEEKDAYS = [
  "Mandag",
  "Tirsdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
  "Lørdag",
  "Søndag",
];
