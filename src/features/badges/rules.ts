/**
 * Pure badge helpers. IMPORTANT: badges are earned through staff review only. Nothing in the membership
 * or billing code may create an assignment — a paid plan never implies "Verified" or any other badge.
 */
import type { BadgeAssignment, BadgeRequest, BusinessBadge } from "../../types/index.ts";

/** Ids of the badges a business currently holds (revoked assignments don't count). */
export function activeBadgeIds(assignments: BadgeAssignment[], businessId: string): string[] {
  return assignments.filter((a) => a.businessId === businessId && a.status === "active").map((a) => a.badgeId);
}

/** Badges a business holds, in the admin-defined display order. Inactive badge types are hidden publicly. */
export function badgesFor(badges: BusinessBadge[], assignments: BadgeAssignment[], businessId: string, opts: { includeInactive?: boolean } = {}): BusinessBadge[] {
  const held = new Set(activeBadgeIds(assignments, businessId));
  return badges.filter((b) => held.has(b.id) && (opts.includeInactive || b.active)).sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Does a business hold every selected badge? (AND semantics: each added filter narrows results.) */
export function hasAllBadges(heldIds: string[], selected: string[]): boolean {
  return selected.every((id) => heldIds.includes(id));
}

export type BadgeState = "active" | "pending" | "rejected" | "revoked" | "none";

/** Where a business stands for one badge type, for the owner's "request a badge" screen. */
export function badgeState(badgeId: string, businessId: string, assignments: BadgeAssignment[], requests: BadgeRequest[]): BadgeState {
  if (assignments.some((a) => a.businessId === businessId && a.badgeId === badgeId && a.status === "active")) return "active";
  const mine = requests.filter((r) => r.businessId === businessId && r.badgeId === badgeId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (mine[0]?.status === "pending") return "pending";
  if (assignments.some((a) => a.businessId === businessId && a.badgeId === badgeId && a.status === "revoked")) return "revoked";
  if (mine[0]?.status === "rejected") return "rejected";
  return "none";
}
