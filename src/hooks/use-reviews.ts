"use client";

import { useMemo } from "react";
import { sortReviewsNewestFirst } from "@/lib/ratings";
import { reviewStore } from "@/services/review-service";
import { useStore } from "./use-store";
import type { Review } from "@/types";

/** Latest website reviews for one business, newest first. */
export function useBusinessReviews(businessId: string | undefined): Review[] {
  const all = useStore(reviewStore);
  return useMemo(
    () => (businessId ? sortReviewsNewestFirst(all.filter((r) => r.businessId === businessId)) : []),
    [all, businessId],
  );
}
