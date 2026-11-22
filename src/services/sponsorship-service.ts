import { createCollectionStore, delay } from "@/lib/demo-store";
import { todayISO } from "@/lib/date";
import { newId } from "@/lib/slug";
import { businessStore } from "@/services/business-service";
import { offerStore } from "@/services/offer-service";
import { adProductStore } from "@/services/ad-service";
import { requireAdmin, requirePermission, type Requester, type Reviewer } from "@/services/actor";
import type { PromotionAssignment, SponsorshipAssignment, SponsorshipRequest, SponsorshipRequestStatus } from "@/types";
import { promotionAssignments as seedPromotions, sponsorshipAssignments as seedAssignments, sponsorshipRequests as seedRequests } from "@/lib/mock-data/sponsorship";

export const sponsorshipRequestStore = createCollectionStore<SponsorshipRequest>("sponsorship-requests", seedRequests);
export const sponsorshipAssignmentStore = createCollectionStore<SponsorshipAssignment>("sponsorship-assignments", seedAssignments);
export const promotionAssignmentStore = createCollectionStore<PromotionAssignment>("promotion-assignments", seedPromotions);

const now = () => new Date().toISOString();

export function sponsorshipAssignmentStatus(a: SponsorshipAssignment, on = todayISO()): SponsorshipAssignment["status"] {
  if (a.status === "cancelled") return "cancelled";
  if (a.endDate < on) return "expired";
  return a.startDate > on ? "scheduled" : "active";
}

export function promotionAssignmentStatus(a: PromotionAssignment, on = todayISO()): PromotionAssignment["status"] {
  if (a.status === "cancelled") return "cancelled";
  if (a.endDate && a.endDate < on) return "expired";
  return a.startDate > on ? "scheduled" : "active";
}

function business(id: string) {
  const found = businessStore.getSnapshot().find((b) => b.id === id);
  if (!found) throw new Error("Business not found.");
  return found;
}

export const sponsorshipService = {
  async submitRequest(input: { businessId: string; details: string }, requester: Requester & { email?: string }): Promise<SponsorshipRequest> {
    await delay(350);
    const b = business(input.businessId);
    if (b.ownerId !== requester.id) throw new Error("You can only request sponsorship information for your own business.");
    if (input.details.trim().length < 10) throw new Error("Tell staff a little more about the opportunity you are considering.");
    const created = now();
    const request: SponsorshipRequest = {
      id: newId("sreq"), businessId: b.id, businessName: b.name, requesterId: requester.id, requesterName: requester.name, requesterEmail: requester.email ?? "",
      details: input.details.trim(), status: "submitted", createdAt: created, updatedAt: created,
    };
    sponsorshipRequestStore.set([request, ...sponsorshipRequestStore.getSnapshot()]);
    return request;
  },

  async reviewRequest(id: string, patch: { status: SponsorshipRequestStatus; staffNote?: string }, reviewer: Reviewer): Promise<SponsorshipRequest> {
    await delay(300);
    requirePermission(reviewer, "sponsorships.review", "review sponsorship requests");
    const current = sponsorshipRequestStore.getSnapshot().find((r) => r.id === id);
    if (!current) throw new Error("Sponsorship request not found.");
    const next = { ...current, status: patch.status, staffNote: patch.staffNote?.trim() || current.staffNote, updatedAt: now() };
    sponsorshipRequestStore.set(sponsorshipRequestStore.getSnapshot().map((r) => r.id === id ? next : r));
    return next;
  },

  async assignSponsorship(input: { businessId: string; packageId: string; startDate: string; endDate: string; notes?: string }, admin: Reviewer): Promise<SponsorshipAssignment> {
    await delay(400);
    requireAdmin(admin, "assign sponsorship packages");
    const b = business(input.businessId);
    const p = adProductStore.getSnapshot().find((product) => product.id === input.packageId && product.family === "sponsorship");
    if (!p) throw new Error("Choose an active sponsorship package.");
    if (!input.startDate || !input.endDate || input.endDate < input.startDate) throw new Error("Choose a valid start and end date.");
    const created = now();
    const assignment: SponsorshipAssignment = {
      id: newId("sassn"), businessId: b.id, businessName: b.name, packageId: p.id, packageName: p.name, placement: p.placement,
      startDate: input.startDate, endDate: input.endDate, status: "scheduled", notes: input.notes?.trim() || undefined, assignedBy: admin.name, createdAt: created, updatedAt: created,
    };
    sponsorshipAssignmentStore.set([assignment, ...sponsorshipAssignmentStore.getSnapshot()]);
    return assignment;
  },

  async updateAssignment(id: string, input: Partial<Pick<SponsorshipAssignment, "startDate" | "endDate" | "notes" | "status">>, admin: Reviewer): Promise<SponsorshipAssignment> {
    await delay(300);
    requireAdmin(admin, "edit sponsorship assignments");
    const current = sponsorshipAssignmentStore.getSnapshot().find((a) => a.id === id);
    if (!current) throw new Error("Sponsorship assignment not found.");
    const next = { ...current, ...input, updatedAt: now() };
    if (next.endDate < next.startDate) throw new Error("End date must be on or after the start date.");
    sponsorshipAssignmentStore.set(sponsorshipAssignmentStore.getSnapshot().map((a) => a.id === id ? next : a));
    return next;
  },

  async removeAssignment(id: string, admin: Reviewer): Promise<void> {
    await delay(250);
    requireAdmin(admin, "remove sponsorship assignments");
    sponsorshipAssignmentStore.set(sponsorshipAssignmentStore.getSnapshot().filter((a) => a.id !== id));
  },

  async assignPromotion(input: { businessId: string; offerId: string; startDate: string; endDate?: string }, admin: Reviewer): Promise<PromotionAssignment> {
    await delay(350);
    requireAdmin(admin, "assign promotions");
    const b = business(input.businessId);
    const offer = offerStore.getSnapshot().find((o) => o.id === input.offerId);
    if (!offer) throw new Error("Choose an existing promotion.");
    if (input.endDate && input.endDate < input.startDate) throw new Error("End date must be on or after the start date.");
    const created = now();
    const assignment: PromotionAssignment = {
      id: newId("passn"), businessId: b.id, businessName: b.name, sourceOfferId: offer.id, promotionTitle: offer.title, discountText: offer.discountText,
      description: offer.description, audience: offer.audience, startDate: input.startDate, endDate: input.endDate, status: "scheduled", assignedBy: admin.name, createdAt: created, updatedAt: created,
    };
    promotionAssignmentStore.set([assignment, ...promotionAssignmentStore.getSnapshot()]);
    return assignment;
  },

  async cancelPromotion(id: string, admin: Reviewer): Promise<void> {
    await delay(250);
    requireAdmin(admin, "cancel promotion assignments");
    promotionAssignmentStore.set(promotionAssignmentStore.getSnapshot().map((a) => a.id === id ? { ...a, status: "cancelled", updatedAt: now() } : a));
  },

  reset() {
    sponsorshipRequestStore.reset();
    sponsorshipAssignmentStore.reset();
    promotionAssignmentStore.reset();
  },
};
