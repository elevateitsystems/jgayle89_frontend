import { badgeAssignments as seedAssignments, badgeRequests as seedRequests, badges as seedBadges } from "@/lib/mock-data/badges";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { daysFromToday } from "@/lib/date";
import { newId } from "@/lib/slug";
import { businessStore } from "@/services/business-service";
import { requirePermission, type Requester, type Reviewer } from "@/services/actor";
import { auditService } from "@/services/audit-service";
import type { BadgeAssignment, BadgeDocument, BadgeRequest, BusinessBadge } from "@/types";

/**
 * Badge & verification data layer (demo implementation).
 * Only staff (verification.review / badges.manage) or admins can create an assignment. Membership,
 * billing and the owner dashboard have no path to one. (Paid plans *derive* the auto-award badge — see features/badges/rules.)
 */
export const badgeStore = createCollectionStore<BusinessBadge>("badges", seedBadges);
export const assignmentStore = createCollectionStore<BadgeAssignment>("badge-assignments", seedAssignments);
export const badgeRequestStore = createCollectionStore<BadgeRequest>("badge-requests", seedRequests);

export type BadgeInput = Omit<BusinessBadge, "id" | "sortOrder">;

const badges = () => badgeStore.getSnapshot();
const assignments = () => assignmentStore.getSnapshot();
const requests = () => badgeRequestStore.getSnapshot();
const today = () => daysFromToday(0);

function activeBadge(id: string) {
  const b = badges().find((x) => x.id === id);
  if (!b) throw new Error("Badge not found.");
  return b;
}

/** Create (or reactivate) the assignment. Shared by request approval and manual assignment. */
function grant(businessId: string, badgeId: string, verifiedBy: string, verifiedOn: string): BadgeAssignment {
  const existing = assignments().find((a) => a.businessId === businessId && a.badgeId === badgeId);
  if (existing?.status === "active") return existing;
  const next: BadgeAssignment = {
    id: existing?.id ?? newId("ba"), businessId, badgeId, status: "active", verifiedOn, verifiedBy,
  };
  assignmentStore.set(existing ? assignments().map((a) => (a.id === existing.id ? next : a)) : [...assignments(), next]);
  return next;
}

export const badgeService = {
  // ---- Admin: badge types
  async create(input: BadgeInput, admin: Reviewer): Promise<BusinessBadge> {
    await delay(400);
    requirePermission(admin, "badge_types.manage", "create badge types");
    if (badges().some((b) => b.name.toLowerCase() === input.name.trim().toLowerCase())) throw new Error("A badge with that name already exists.");
    const badge: BusinessBadge = { ...input, name: input.name.trim(), id: newId("badge"), sortOrder: Math.max(0, ...badges().map((b) => b.sortOrder)) + 1 };
    badgeStore.set([...badges(), badge]);
    auditService.record(admin, "badges", "created badge type", { id: badge.id, name: badge.name });
    return badge;
  },

  async update(id: string, input: Partial<BadgeInput>, admin: Reviewer): Promise<BusinessBadge> {
    await delay(400);
    requirePermission(admin, "badge_types.manage", "edit badge types");
    const current = activeBadge(id);
    if (input.name && badges().some((b) => b.id !== id && b.name.toLowerCase() === input.name!.trim().toLowerCase())) throw new Error("A badge with that name already exists.");
    const next = { ...current, ...input, ...(input.name ? { name: input.name.trim() } : {}) };
    badgeStore.set(badges().map((b) => (b.id === id ? next : b)));
    const action = input.active !== undefined && input.active !== current.active ? (input.active ? "activated badge type" : "deactivated badge type") : current.name !== next.name ? "renamed badge type" : "edited badge type";
    auditService.record(admin, "badges", action, { id, name: next.name }, current.name !== next.name ? `“${current.name}” → “${next.name}”` : undefined);
    return next;
  },

  // ---- Owner: request a badge
  async request(input: { businessId: string; badgeId: string; note: string; documents: BadgeDocument[] }, requester: Requester): Promise<BadgeRequest> {
    await delay(600);
    const business = businessStore.getSnapshot().find((b) => b.id === input.businessId);
    if (!business) throw new Error("Business not found.");
    if (business.ownerId !== requester.id) throw new Error("You can only request badges for businesses you own.");
    const badge = activeBadge(input.badgeId);
    if (!badge.active) throw new Error("This badge isn't currently available.");
    if (assignments().some((a) => a.businessId === business.id && a.badgeId === badge.id && a.status === "active")) throw new Error("This business already has that badge.");
    if (requests().some((r) => r.businessId === business.id && r.badgeId === badge.id && r.status === "pending")) throw new Error("A request for this badge is already pending.");
    if (badge.requiresDocuments && input.documents.length === 0) throw new Error("Attach at least one supporting document.");
    const req: BadgeRequest = {
      id: newId("bq"), businessId: business.id, businessName: business.name, badgeId: badge.id,
      requesterId: requester.id, requesterName: requester.name, status: "pending",
      note: input.note.trim(), documents: input.documents, createdAt: new Date().toISOString(),
    };
    badgeRequestStore.set([req, ...requests()]);
    return req;
  },

  // ---- Staff: review a request
  async review(id: string, decision: "approve" | "reject", input: { verifiedOn: string; note: string }, reviewer: Reviewer): Promise<BadgeRequest> {
    await delay(600);
    requirePermission(reviewer, "verification.review", "review verification requests");
    const req = requests().find((r) => r.id === id);
    if (!req) throw new Error("Request not found.");
    if (req.status !== "pending") throw new Error("This request has already been reviewed.");
    if (decision === "reject" && input.note.trim().length < 5) throw new Error("Add a short note explaining why it was rejected.");
    if (decision === "approve") {
      if (!input.verifiedOn) throw new Error("Record the verification date.");
      if (input.verifiedOn > today()) throw new Error("The verification date can't be in the future.");
      grant(req.businessId, req.badgeId, reviewer.name, input.verifiedOn);
    }
    const next: BadgeRequest = {
      ...req, status: decision === "approve" ? "approved" : "rejected", reviewerName: reviewer.name,
      reviewNote: input.note.trim() || undefined, reviewedOn: today(), verifiedOn: decision === "approve" ? input.verifiedOn : undefined,
    };
    badgeRequestStore.set(requests().map((r) => (r.id === id ? next : r)));
    return next;
  },

  // ---- Staff: manual assign / revoke
  async assign(businessId: string, badgeId: string, verifiedOn: string, staff: Reviewer): Promise<BadgeAssignment> {
    await delay(400);
    requirePermission(staff, "badges.manage", "assign badges");
    if (!businessStore.getSnapshot().some((b) => b.id === businessId)) throw new Error("Business not found.");
    const badge = activeBadge(badgeId);
    if (!badge.active) throw new Error("Inactive badges can't be assigned.");
    if (verifiedOn > today()) throw new Error("The verification date can't be in the future.");
    const a = grant(businessId, badgeId, staff.name, verifiedOn);
    auditService.record(staff, "badges", "assigned badge", { id: a.id, name: `${badge.name} · ${businessStore.getSnapshot().find((b) => b.id === businessId)?.name ?? businessId}` });
    return a;
  },

  /** Turn an assignment off (hidden publicly) or back on, without revoking it. */
  async setAssignmentVisible(assignmentId: string, visible: boolean, staff: Reviewer): Promise<void> {
    await delay(250);
    requirePermission(staff, "badges.manage", "turn badges on or off");
    const current = assignments().find((a) => a.id === assignmentId);
    if (!current || current.status !== "active") throw new Error("That badge isn't currently assigned.");
    assignmentStore.set(assignments().map((a) => (a.id === assignmentId ? { ...a, hidden: !visible } : a)));
    auditService.record(staff, "badges", visible ? "turned badge on" : "turned badge off", { id: assignmentId, name: `${activeBadge(current.badgeId).name} · ${businessStore.getSnapshot().find((b) => b.id === current.businessId)?.name ?? current.businessId}` });
  },

  async revoke(assignmentId: string, reason: string, staff: Reviewer): Promise<BadgeAssignment> {
    await delay(400);
    requirePermission(staff, "badges.manage", "revoke badges");
    const current = assignments().find((a) => a.id === assignmentId);
    if (!current || current.status !== "active") throw new Error("That badge isn't currently assigned.");
    if (reason.trim().length < 5) throw new Error("Add a short reason for revoking this badge.");
    const next: BadgeAssignment = { ...current, status: "revoked", revokedOn: today(), revokedBy: staff.name, revokedReason: reason.trim() };
    assignmentStore.set(assignments().map((a) => (a.id === assignmentId ? next : a)));
    auditService.record(staff, "badges", "removed badge", { id: assignmentId, name: activeBadge(current.badgeId).name }, reason.trim());
    return next;
  },

  reset() {
    badgeStore.reset();
    assignmentStore.reset();
    badgeRequestStore.reset();
  },
};
