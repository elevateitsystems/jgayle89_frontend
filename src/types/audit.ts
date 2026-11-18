/** Who changed what in the back office, and when. */

export type AuditArea =
  | "categories"
  | "badges"
  | "offers"
  | "freebies"
  | "benefits"
  | "services"
  | "promotions"
  | "settings"
  | "businesses"
  | "appointments"
  | "orders";

export interface AuditEntry {
  id: string;
  at: string; // ISO datetime
  actorId: string;
  actorName: string;
  area: AuditArea;
  action: string; // "created", "renamed", "deactivated", …
  targetId: string;
  targetName: string;
  details?: string;
}
