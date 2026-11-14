/**
 * Pure helpers for the business edit-request workflow: which fields can be requested, how a
 * proposed change differs from the live listing, and how to describe a value for a side-by-side preview.
 */
import type { Business, BusinessChanges, EditableBusinessFields, EditableFieldKey } from "../../types/index.ts";

export const EDITABLE_FIELDS: { key: EditableFieldKey; label: string; multiline?: boolean }[] = [
  { key: "name", label: "Business name" },
  { key: "tagline", label: "Tagline" },
  { key: "description", label: "Description", multiline: true },
  { key: "services", label: "Services" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "website", label: "Website" },
  { key: "hours", label: "Hours" },
  { key: "address", label: "Street address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "ZIP code" },
  { key: "socialLinks", label: "Social media links" },
  { key: "promotions", label: "Discounts & promotions" },
];

export const fieldLabel = (key: EditableFieldKey) => EDITABLE_FIELDS.find((f) => f.key === key)?.label ?? key;

/** The editable slice of a live listing. */
export function editableSnapshot(b: Business): EditableBusinessFields {
  return {
    name: b.name, tagline: b.tagline, description: b.description, services: b.services,
    phone: b.phone, email: b.email, website: b.website, hours: b.hours,
    address: b.address, city: b.city, state: b.state, zip: b.zip,
    socialLinks: b.socialLinks ?? [], promotions: b.promotions ?? [],
  };
}

const stable = (v: unknown) => JSON.stringify(v);

/** Keeps only the fields whose proposed value differs from what the listing currently has. */
export function effectiveChanges(current: EditableBusinessFields, proposed: BusinessChanges): BusinessChanges {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(proposed)) {
    if (v === undefined) continue;
    if (stable(current[k as EditableFieldKey]) !== stable(v)) out[k] = v;
  }
  return out as BusinessChanges;
}

export const changedKeys = (changes: BusinessChanges) => Object.keys(changes) as EditableFieldKey[];

/** Plain-text rendering of a field value for diff displays. */
export function describeValue(key: EditableFieldKey, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (key === "services") return (value as string[]).length ? (value as string[]).join(", ") : "—";
  if (key === "socialLinks") {
    const links = value as { platform: string; url: string; label?: string }[];
    return links.length ? links.map((l) => `${l.label || l.platform}: ${l.url}`).join("\n") : "—";
  }
  if (key === "promotions") {
    const promos = value as { title: string; discountText: string }[];
    return promos.length ? promos.map((p) => `${p.title} (${p.discountText})`).join("\n") : "—";
  }
  return String(value);
}

export function summarizeChanges(changes: BusinessChanges): string {
  const labels = changedKeys(changes).map(fieldLabel);
  if (labels.length === 0) return "No changes";
  if (labels.length <= 2) return labels.join(" & ");
  return `${labels.slice(0, 2).join(", ")} +${labels.length - 2} more`;
}

export const EDIT_STATUS_LABEL = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
} as const;
