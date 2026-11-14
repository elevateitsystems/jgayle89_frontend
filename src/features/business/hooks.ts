"use client";

import { useMemo } from "react";
import { useBusinesses } from "@/hooks/use-businesses";
import { useStore } from "@/hooks/use-store";
import { mockAnalytics } from "@/lib/mock-data/analytics";
import { editRequestStore } from "@/services/edit-request-service";

/** Businesses owned by one Business Owner account. */
export function useOwnedBusinesses(ownerId: string | undefined) {
  const { businesses, loading } = useBusinesses();
  const owned = useMemo(() => (ownerId ? businesses.filter((b) => b.ownerId === ownerId) : []), [businesses, ownerId]);
  return { businesses: owned, loading };
}

export function useEditRequests() {
  return useStore(editRequestStore);
}

/** Edit requests for businesses owned by this account, newest first. */
export function useOwnerEditRequests(ownerId: string | undefined) {
  const all = useEditRequests();
  return useMemo(
    () => all.filter((r) => r.requesterId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, ownerId],
  );
}

/** Demo analytics for a business (deterministic per business id). Swap for the analytics API later. */
export function useBusinessAnalytics(businessId: string | undefined, rangeDays = 30) {
  return useMemo(() => (businessId ? mockAnalytics(businessId, rangeDays) : null), [businessId, rangeDays]);
}
