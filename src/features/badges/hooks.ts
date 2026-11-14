"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { activeBadgeIds, badgesFor } from "@/features/badges/rules";
import { assignmentStore, badgeRequestStore, badgeStore } from "@/services/badge-service";

export function useBadges() {
  return useStore(badgeStore);
}
export function useBadgeAssignments() {
  return useStore(assignmentStore);
}
export function useBadgeRequests() {
  return useStore(badgeRequestStore);
}

/** Active badges a business holds (inactive badge types are hidden unless `includeInactive`). */
export function useBusinessBadges(businessId: string | undefined, opts: { includeInactive?: boolean } = {}) {
  const badges = useBadges();
  const assignments = useBadgeAssignments();
  const includeInactive = !!opts.includeInactive;
  return useMemo(
    () => (businessId ? badgesFor(badges, assignments, businessId, { includeInactive }) : []),
    [badges, assignments, businessId, includeInactive],
  );
}

/** Lookup used by directory filtering and cards: businessId → held badge ids (active badge types only). */
export function useBadgeLookup() {
  const badges = useBadges();
  const assignments = useBadgeAssignments();
  return useMemo(() => {
    const live = new Set(badges.filter((b) => b.active).map((b) => b.id));
    const byBusiness = new Map<string, string[]>();
    for (const a of assignments) {
      if (a.status !== "active" || !live.has(a.badgeId)) continue;
      byBusiness.set(a.businessId, [...(byBusiness.get(a.businessId) ?? []), a.badgeId]);
    }
    return {
      badges,
      idsFor: (businessId: string): string[] => byBusiness.get(businessId) ?? [],
      /** Count of businesses holding each badge (for filter chips). */
      counts: assignments.reduce<Record<string, number>>((acc, a) => {
        if (a.status === "active" && live.has(a.badgeId)) acc[a.badgeId] = (acc[a.badgeId] ?? 0) + 1;
        return acc;
      }, {}),
    };
  }, [badges, assignments]);
}

export { activeBadgeIds };
