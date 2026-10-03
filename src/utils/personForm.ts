import type { Person, UnavailablePeriod } from "../types";
import { publicProfileFields, toPublicProfile } from "./publicProfile";

export type StaffCategory = NonNullable<Person["staffCategory"]>;

/** What an admin edits on a person's card. Text fields are kept as typed and trimmed when saved. */
export interface PersonFormValues {
  name: string;
  phone: string;
  email: string;
  globalRole: "member" | "admin";
  policeCert: string;
  unavailablePeriods: UnavailablePeriod[];
  isPublicProfile: boolean;
  publicTitle: string;
  publicPhone: string;
  publicEmail: string;
  avatarUrl: string;
  isStaff: boolean;
  staffRole: string;
  staffCategory: StaffCategory;
  staffBio: string;
}

/** The form as it should look when the card opens: what is stored on the person. */
export function personToForm(person: Person): PersonFormValues {
  return {
    name: person.name,
    phone: person.phone || "",
    email: person.email || "",
    globalRole: person.globalRole || "member",
    policeCert: person.policeCertificateValidUntil || "",
    unavailablePeriods: person.unavailablePeriods || [],
    isPublicProfile: toPublicProfile(person) !== null,
    publicTitle: person.publicTitle || "",
    publicPhone: person.publicPhone || "",
    publicEmail: person.publicEmail || "",
    avatarUrl: person.avatarUrl || "",
    isStaff: Boolean(person.isStaff),
    staffRole: person.staffRole || person.publicTitle || "",
    staffCategory: person.staffCategory || "stab",
    staffBio: person.staffBio || "",
  };
}

/**
 * What to store when the card is saved. A field left empty is removed from the person.
 * Staff are always shown publicly, so being staff turns the public profile on too.
 */
export function formToPersonUpdates(person: Person, form: PersonFormValues, adminId: string): Partial<Person> {
  return {
    name: form.name.trim(),
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    globalRole: form.globalRole,
    avatarUrl: form.avatarUrl.trim() || undefined,
    isStaff: form.isStaff,
    staffRole: form.staffRole.trim() || undefined,
    staffCategory: form.staffCategory,
    staffBio: form.staffBio.trim() || undefined,
    policeCertificateValidUntil: form.policeCert || undefined,
    unavailablePeriods: form.unavailablePeriods,
    ...publicProfileFields(
      person,
      {
        isPublic: form.isPublicProfile || form.isStaff,
        title: (form.staffRole || form.publicTitle).trim(),
        phone: form.publicPhone,
        email: form.publicEmail,
      },
      adminId
    ),
  };
}
