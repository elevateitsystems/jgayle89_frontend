"use client";

import { useEffect, useState } from "react";
import { googleRatingProvider } from "@/services/google-rating-service";
import type { Business, GoogleRatingSummary } from "@/types";

/**
 * Google rating for a business via the provider seam.
 * `loading` is true until the provider answers for the *current* business.
 */
export function useGoogleRating(business: Pick<Business, "id" | "slug" | "googlePlaceId"> | undefined) {
  const [result, setResult] = useState<{ id: string; rating: GoogleRatingSummary | null } | null>(null);
  const id = business?.id;
  const slug = business?.slug;
  const placeId = business?.googlePlaceId;

  useEffect(() => {
    if (!id || !slug) return;
    let cancelled = false;
    googleRatingProvider
      .getRating({ id, slug, googlePlaceId: placeId })
      .then((rating) => !cancelled && setResult({ id, rating }))
      .catch(() => !cancelled && setResult({ id, rating: null }));
    return () => {
      cancelled = true;
    };
  }, [id, slug, placeId]);

  const ready = !!id && result?.id === id;
  return { google: ready ? result.rating : null, loading: !!id && !ready };
}
