"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { liveCampaigns, ofKind } from "@/features/advertising/rules";
import { todayISO } from "@/lib/date";
import { adProductStore, campaignStore, creditStore } from "@/services/ad-service";
import type { AdProduct } from "@/types";

export function useAdProducts() {
  return useStore(adProductStore);
}
export function useCampaigns() {
  return useStore(campaignStore);
}
export function useCredits() {
  return useStore(creditStore);
}

/**
 * Campaigns that are live right now, paired with their product. Every public placement reads this,
 * and every public placement must show the product's `label` ("Sponsored" / "Advertisement").
 */
export function useLiveCampaigns() {
  const campaigns = useCampaigns();
  const products = useAdProducts();
  return useMemo(() => liveCampaigns(campaigns, products, todayISO()), [campaigns, products]);
}

export function useLiveCampaignsOfKind(kind: AdProduct["kind"]) {
  const live = useLiveCampaigns();
  return useMemo(() => ofKind(live, kind), [live, kind]);
}
