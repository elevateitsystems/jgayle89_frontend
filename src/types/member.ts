/** Member (Veteran / Civilian) dashboard entities. */

export interface SavedBusiness {
  id: string;
  userId: string;
  businessId: string;
  savedOn: string; // ISO date
}

export type AppointmentStatus = "requested" | "confirmed" | "completed" | "cancelled";
export type AppointmentMode = "phone" | "video" | "in_person";

export interface Appointment {
  id: string;
  userId: string;
  topic: string;
  mode: AppointmentMode;
  date: string; // ISO date
  time: string; // "14:30"
  notes: string;
  status: AppointmentStatus;
  createdAt: string; // ISO datetime
}

export type ResourceKind = "community" | "career" | "financial-tool" | "financial-education";

export interface CommunityResource {
  id: string;
  kind: ResourceKind;
  title: string;
  summary: string;
  provider: string;
  url: string;
  tags: string[];
  audience: "veteran" | "civilian" | "all";
  /** If set, the resource needs this plan feature (see lib/mock-data/membership). */
  requiresFeature?: string;
}
