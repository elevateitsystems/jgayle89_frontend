import type { GoogleRatingSummary } from "@/types";

/**
 * MOCK DATA — static stand-ins for Google rating summaries, keyed by business slug.
 * These are invented numbers, NOT pulled from Google. Replace the provider in
 * src/services/google-rating-service.ts to use the Places API (see that file).
 */
type Mock = Omit<GoogleRatingSummary, "source">;

export const mockGoogleRatings: Record<string, Mock> = {
  "ironwood-coffee-roasters": { rating: 4.7, reviewCount: 318 },
  "summit-rally-brewing": { rating: 4.5, reviewCount: 642 },
  "fieldstone-bakehouse": { rating: 4.8, reviewCount: 205 },
  "oak-and-anchor-kitchen": { rating: 4.4, reviewCount: 874 },
  "bravo-company-builders": { rating: 4.9, reviewCount: 83 },
  "sparkline-welding-fabrication": { rating: 4.8, reviewCount: 61 },
  "torque-and-tread-auto-care": { rating: 4.6, reviewCount: 412 },
  "longhaul-logistics-group": { rating: 4.1, reviewCount: 97 },
  "meridian-legal-advisory": { rating: 5.0, reviewCount: 36 },
  "fortitude-financial-planning": { rating: 4.9, reviewCount: 52 },
  "vector-cyber-solutions": { rating: 4.7, reviewCount: 29 },
  "northstar-web-software": { rating: 4.6, reviewCount: 41 },
  "ranger-strength-conditioning": { rating: 4.8, reviewCount: 389 },
  "stillwater-yoga-recovery": { rating: 4.9, reviewCount: 144 },
  "homefront-realty-group": { rating: 4.8, reviewCount: 176 },
  "sentinel-home-security": { rating: 4.3, reviewCount: 91 },
  "greenline-lawn-landscape": { rating: 4.5, reviewCount: 158 },
  "trailhead-outfitters": { rating: 4.9, reviewCount: 263 },
  "frontline-photo-film": { rating: 4.8, reviewCount: 57 },
  // garrison-barber-shave intentionally has no entry: exercises the "no Google data" state.
};
