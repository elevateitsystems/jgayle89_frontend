import { createCollectionStore } from "@/lib/demo-store";
import { newId } from "@/lib/slug";
import type { AppUser, AuditArea, AuditEntry } from "@/types";

/**
 * Back-office change log (demo). Every structural change — categories, badges, offers, services, settings —
 * is recorded with who did it and when. The API should write these server-side in the same transaction.
 */
const seed: AuditEntry[] = [
  { id: "aud_seed_1", at: "2026-10-02T15:12:00Z", actorId: "usr_001", actorName: "Demo Admin", area: "categories", action: "created", targetId: "sub_food_food-trucks", targetName: "Food Trucks", details: "Subcategory of Food & Drink" },
  { id: "aud_seed_2", at: "2026-10-14T10:40:00Z", actorId: "usr_001", actorName: "Demo Admin", area: "badges", action: "edited", targetId: "badge_vet_owned", targetName: "Veteran-Owned", details: "Updated description" },
  { id: "aud_seed_3", at: "2026-11-03T18:05:00Z", actorId: "usr_002", actorName: "Sam Rivera", area: "offers", action: "approved", targetId: "off_003", targetName: "Holiday catering special" },
];

export const auditStore = createCollectionStore<AuditEntry>("audit-log", seed);

type Actor = Pick<AppUser, "id" | "name">;

export const auditService = {
  record(actor: Actor, area: AuditArea, action: string, target: { id: string; name: string }, details?: string) {
    const entry: AuditEntry = {
      id: newId("aud"),
      at: new Date().toISOString(),
      actorId: actor.id,
      actorName: actor.name,
      area,
      action,
      targetId: target.id,
      targetName: target.name,
      details,
    };
    auditStore.set([entry, ...auditStore.getSnapshot()]);
    return entry;
  },
  reset() {
    auditStore.reset();
  },
};
