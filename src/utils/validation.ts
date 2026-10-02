import { Gathering, Event } from "../types";

export class ValidationError extends Error {
  constructor(message: string, public readonly field?: string, public readonly invalidData?: unknown) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validates a Gathering/Event object strictly.
 * Throws a ValidationError if required fields (title, startsAt) are missing or invalid,
 * rather than silently hiding corrupted database state.
 */
export function validateEvent(data: unknown): Event {
  if (!data || typeof data !== "object") {
    throw new ValidationError("Arrangement-data må være et gyldig objekt", undefined, data);
  }

  const record = data as Record<string, unknown>;

  if (!record.id || typeof record.id !== "string" || !record.id.trim()) {
    throw new ValidationError("Arrangement mangler gyldig ID", "id", data);
  }

  if (!record.title || typeof record.title !== "string" || !record.title.trim()) {
    throw new ValidationError("Arrangement mangler tittel", "title", data);
  }

  if (!record.startsAt || typeof record.startsAt !== "string" || isNaN(Date.parse(record.startsAt))) {
    throw new ValidationError("Arrangement mangler gyldig dato (startsAt)", "startsAt", data);
  }

  const validVisibilities = ["intern", "offentlig", "fremhevet"];
  if (record.visibility && !validVisibilities.includes(record.visibility as string)) {
    throw new ValidationError(
      `Ugyldig synlighet '${record.visibility}'. Må være 'intern', 'offentlig' eller 'fremhevet'`,
      "visibility",
      data
    );
  }

  return data as Event;
}

export function validateGathering(data: unknown): Gathering {
  return validateEvent(data);
}
