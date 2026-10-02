// Helper function to format Norwegian dates nicely
export function formatNorwegianDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];
    const months = ["jan.", "feb.", "mars", "apr.", "mai", "juni", "juli", "aug.", "sep.", "okt.", "nov.", "des."];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${dayName} ${dayNum}. ${monthName} kl. ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

// Helper to format chat message timestamps in Norwegian
export function formatChatMessageTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    if (isToday) {
      return `I dag kl. ${hours}:${minutes}`;
    }
    if (isYesterday) {
      return `I går kl. ${hours}:${minutes}`;
    }

    const months = [
      "jan.", "feb.", "mars", "apr.", "mai", "juni",
      "juli", "aug.", "sep.", "okt.", "nov.", "des."
    ];
    return `${date.getDate()}. ${months[date.getMonth()]} kl. ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

// Compact line format as requested (e.g., "søndag 16. august 2026 · 11:00 · Gitmark · Gudstjeneste")
export function formatCompactGatheringSubtitle(
  isoString: string,
  location?: string,
  typeOrGroup?: string
): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const days = ["søndag", "mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag"];
    const months = [
      "januar",
      "februar",
      "mars",
      "april",
      "mai",
      "juni",
      "juli",
      "august",
      "september",
      "oktober",
      "november",
      "desember",
    ];

    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    const parts: string[] = [
      `${dayName} ${dayNum}. ${monthName} ${year}`,
      `${hours}:${minutes}`,
    ];

    if (location) {
      parts.push(location);
    }

    if (typeOrGroup) {
      parts.push(typeOrGroup);
    }

    return parts.join(" · ");
  } catch {
    return isoString;
  }
}

// Helpers for input date/time editing
export function parseIsoToDateAndTime(isoString: string): { date: string; time: string } {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return { date: "", time: "11:00" };
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
  } catch {
    return { date: "", time: "11:00" };
  }
}

export function combineDateAndTimeToIso(dateStr: string, timeStr: string): string {
  try {
    const [yyyy, mm, dd] = dateStr.split("-").map(Number);
    const [hh, min] = (timeStr || "11:00").split(":").map(Number);
    const d = new Date(yyyy, mm - 1, dd, hh || 0, min || 0, 0);
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}
