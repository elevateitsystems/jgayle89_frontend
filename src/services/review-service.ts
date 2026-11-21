import { reviews as seed } from "@/data/reviews";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { newId } from "@/lib/slug";
import { businessService } from "@/services/business-service";
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

  /** Creates a local demo review and updates the listing aggregate in the browser. */
  async create(input: { businessId: string; author: string; rating: number; title: string; body: string }): Promise<Review> {
    await delay(300);
    const business = await businessService.getById(input.businessId);
    if (!business) throw new Error("Business not found.");
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) throw new Error("Choose a rating from 1 to 5.");
    const review: Review = { ...input, id: newId("rev"), createdAt: new Date().toISOString().slice(0, 10) };
    reviewStore.set([review, ...reviewStore.getSnapshot()]);
    const total = business.rating * business.reviewCount + review.rating;
    await businessService.update(input.businessId, {
      rating: Math.round((total / Math.max(1, business.reviewCount + 1)) * 10) / 10,
      reviewCount: business.reviewCount + 1,
    });
    return review;
  },
};
