"use client";

import { useMemo } from "react";
import { businessStore } from "@/services/business-service";
import { useSimulatedLoading, useStore } from "./use-store";
import type { Business } from "@/types";

/** All businesses (admin sees every status). */
export function useBusinesses() {
  const all = useStore(businessStore);
  const loading = useSimulatedLoading();
  return { businesses: all, loading };
}

/** Publicly visible businesses only. */
export function usePublicBusinesses() {
  const { businesses, loading } = useBusinesses();
  const active = useMemo(() => businesses.filter((b) => b.status === "active"), [businesses]);
  return { businesses: active, loading };
}

export function useBusiness(match: { slug?: string; id?: string }) {
  const { businesses, loading } = useBusinesses();
  const business: Business | undefined = useMemo(
    () => businesses.find((b) => (match.slug ? b.slug === match.slug : b.id === match.id)),
    [businesses, match.slug, match.id],
  );
  return { business, loading };
}
