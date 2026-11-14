"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { findSubscription, plansFor, resolvePlan } from "@/features/membership/access";
import { invoiceStore, planStore, subscriptionStore } from "@/services/membership-service";
import type { PlanAudience } from "@/types";

export function useAllPlans() {
  return useStore(planStore);
}

/** Plans for one audience, ordered. Public pages pass `activeOnly` so deactivated plans disappear. */
export function usePlans(audience: PlanAudience, opts: { activeOnly?: boolean } = {}) {
  const all = useStore(planStore);
  const activeOnly = !!opts.activeOnly;
  return useMemo(() => plansFor(all, audience, { activeOnly }), [all, audience, activeOnly]);
}

export function useSubscriptions() {
  return useStore(subscriptionStore);
}

export function useInvoices() {
  return useStore(invoiceStore);
}

/** The subscription record for a member (subjectId = user id) or a business (subjectId = business id). */
export function useSubscriptionFor(audience: PlanAudience, subjectId: string | undefined) {
  const subs = useStore(subscriptionStore);
  return useMemo(() => (subjectId ? findSubscription(subs, audience, subjectId) : undefined), [subs, audience, subjectId]);
}

/** The plan whose features currently apply (falls back to Free when there's no live subscription). */
export function useResolvedPlan(audience: PlanAudience, subjectId: string | undefined) {
  const plans = useStore(planStore);
  const subs = useStore(subscriptionStore);
  return useMemo(() => (subjectId ? resolvePlan(plans, subs, audience, subjectId) : undefined), [plans, subs, audience, subjectId]);
}

/** Resolved plan for each business id — for lists that show every business's tier. */
export function useBusinessPlans(businessIds: string[]) {
  const plans = useStore(planStore);
  const subs = useStore(subscriptionStore);
  const key = businessIds.join("|");
  return useMemo(() => {
    const map = new Map<string, ReturnType<typeof resolvePlan>>();
    for (const id of key ? key.split("|") : []) map.set(id, resolvePlan(plans, subs, "business", id));
    return map;
  }, [plans, subs, key]);
}
