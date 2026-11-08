import type { GoogleRatingSummary, Review } from "@/types";

/**
 * Pure rating helpers (no runtime imports, unit-testable).
 *
 * Website vs Google: the website rating is the platform's own rating
 * (Business.rating / Business.reviewCount, which the admin form edits) and is
 * always shown. The Google rating is a separate figure supplied by a provider and
 * is shown only when the admin setting is on AND the provider has data.
 */
export function shouldShowGoogleRating(
  settings: { showGoogleRatings: boolean },
  google: GoogleRatingSummary | null | undefined,
): google is GoogleRatingSummary {
  return settings.showGoogleRatings && !!google && google.reviewCount > 0;
}

/** Newest first. Returns a copy. */
export function sortReviewsNewestFirst(reviews: Review[]): Review[] {
  return [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Average of a (sample) set of reviews, 1 decimal place; null when empty. */
export function averageRating(reviews: Pick<Review, "rating">[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}
