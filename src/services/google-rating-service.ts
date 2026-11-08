import { mockGoogleRatings } from "@/data/google-ratings";
import { delay } from "@/lib/demo-store";
import type { Business, GoogleRatingSummary } from "@/types";

/**
 * Google rating provider — the seam for the real integration.
 *
 * Today: `mockGoogleRatingProvider` returns static, invented numbers.
 *
 * To integrate the Google Places API later:
 *  1. Add a server-side route handler (e.g. src/app/api/google-rating/route.ts)
 *     that calls Places "Place Details" with the business's `googlePlaceId`,
 *     requesting only `rating` and `userRatingCount`. Keep the API key in a
 *     server-only env var (e.g. GOOGLE_PLACES_API_KEY) — never in client code.
 *  2. Cache responses (Google's terms limit how long ratings may be stored) and
 *     show Google's required attribution next to the rating.
 *  3. Implement `GoogleRatingProvider` with a `fetch` to that route, returning
 *     `source: "google-places"`, and export it as `googleRatingProvider` below.
 * No UI changes are needed.
 */
export interface GoogleRatingProvider {
  getRating(business: Pick<Business, "id" | "slug" | "googlePlaceId">): Promise<GoogleRatingSummary | null>;
}

export const mockGoogleRatingProvider: GoogleRatingProvider = {
  async getRating(business) {
    await delay(200);
    const mock = mockGoogleRatings[business.slug];
    return mock ? { ...mock, source: "mock" } : null;
  },
};

export const googleRatingProvider: GoogleRatingProvider = mockGoogleRatingProvider;
