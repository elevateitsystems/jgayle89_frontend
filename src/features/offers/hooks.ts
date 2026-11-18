"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { todayISO } from "@/lib/date";
import { isOfferLive } from "@/features/offers/rules";
import { freebieStore, offerStore } from "@/services/offer-service";

export const useFreebies = () => useStore(freebieStore);
export const useOffers = () => useStore(offerStore);

/** Every offer for one business (any status) — owner and staff views. */
export function useBusinessOffers(businessId: string | undefined) {
  const all = useOffers();
  return useMemo(() => (businessId ? all.filter((o) => o.businessId === businessId) : []), [all, businessId]);
}

/** Published, not-expired offers shown on the public profile. */
export function useLiveOffers(businessId: string | undefined) {
  const all = useOffers();
  return useMemo(() => {
    if (!businessId) return [];
    const today = todayISO();
    return all.filter((o) => o.businessId === businessId && isOfferLive(o, today));
  }, [all, businessId]);
}
