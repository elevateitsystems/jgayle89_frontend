"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { businessStore } from "@/services/business-service";
import { activeBadgeIds, autoBadgeIds, badgesFor } from "@/features/badges/rules";
import { resolvePlan } from "@/features/membership/access";
import { useAllPlans, useSubscriptions } from "@/features/membership/hooks";
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
/** businessId → is it on an active paid business plan? (drives auto-awarded badges like "Verified Business"). */
export function usePaidBusinessCheck() {
  const plans = useAllPlans();
  const subs = useSubscriptions();
  return useMemo(() => {
    // Only businesses with a subscription can be on a paid plan; everyone else resolves to Free.
    const paid = new Set(
      subs.filter((s) => s.audience === "business" && (resolvePlan(plans, subs, "business", s.subjectId)?.monthlyPrice ?? 0) > 0).map((s) => s.subjectId),
    );
    return (businessId: string) => paid.has(businessId);
  }, [plans, subs]);
}

export function useBusinessBadges(businessId: string | undefined, opts: { includeInactive?: boolean } = {}) {
  const badges = useBadges();
  const assignments = useBadgeAssignments();
  const isPaid = usePaidBusinessCheck();
  const includeInactive = !!opts.includeInactive;
  return useMemo(
    () => (businessId ? badgesFor(badges, assignments, businessId, { includeInactive, onPaidPlan: isPaid(businessId) }) : []),
    [badges, assignments, businessId, includeInactive, isPaid],
  );
}

/** Lookup used by directory filtering and cards: businessId → held badge ids (active badge types only). */
export function useBadgeLookup() {
  const badges = useBadges();
  const assignments = useBadgeAssignments();
  const isPaid = usePaidBusinessCheck();
  const businesses = useStore(businessStore);
  return useMemo(() => {
    const live = new Set(badges.filter((b) => b.active).map((b) => b.id));
    const byBusiness = new Map<string, Set<string>>();
    const add = (businessId: string, badgeId: string) => byBusiness.set(businessId, (byBusiness.get(businessId) ?? new Set()).add(badgeId));
    for (const a of assignments) {
      if (a.status !== "active" || a.hidden || !live.has(a.badgeId)) continue;
      add(a.businessId, a.badgeId);
    }
    // Auto-awarded badges (e.g. "Verified Business" on paid plans) count too.
    for (const b of businesses) for (const id of autoBadgeIds(badges, isPaid(b.id))) if (live.has(id)) add(b.id, id);
    const counts: Record<string, number> = {};
    for (const ids of byBusiness.values()) for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
    return {
      badges,
      idsFor: (businessId: string): string[] => [...(byBusiness.get(businessId) ?? [])],
      /** Count of businesses holding each badge (for filter chips). */
      counts,
    };
  }, [badges, assignments, isPaid, businesses]);
}

export { activeBadgeIds };
