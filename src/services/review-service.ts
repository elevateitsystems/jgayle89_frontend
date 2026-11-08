import { reviews as seed } from "@/data/reviews";
import { createCollectionStore, delay } from "@/lib/demo-store";
import type { Review } from "@/types";

/**
 * Website (platform) review data-access layer — demo implementation.
 * Swap for `fetch("/api/businesses/:id/reviews")` when the API exists. The
 * business's aggregate (Business.rating / reviewCount) is expected to be
 * computed server-side; the list here is just the latest reviews.
 */
export const reviewStore = createCollectionStore<Review>("reviews", seed);

export const reviewService = {
  async listForBusiness(businessId: string): Promise<Review[]> {
    await delay(150);
    return reviewStore.getSnapshot().filter((r) => r.businessId === businessId);
  },
};
