import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { averageRating, shouldShowGoogleRating, sortReviewsNewestFirst } from "./ratings.ts";
import type { GoogleRatingSummary, Review } from "../types/index.ts";

const google: GoogleRatingSummary = { rating: 4.8, reviewCount: 120, source: "mock" };

describe("shouldShowGoogleRating (admin toggle)", () => {
  it("shows when enabled and data exists", () => {
    assert.equal(shouldShowGoogleRating({ showGoogleRatings: true }, google), true);
  });
  it("hides when the admin setting is off, even if data exists", () => {
    assert.equal(shouldShowGoogleRating({ showGoogleRatings: false }, google), false);
  });
  it("hides when there is no Google data or no reviews", () => {
    assert.equal(shouldShowGoogleRating({ showGoogleRatings: true }, null), false);
    assert.equal(shouldShowGoogleRating({ showGoogleRatings: true }, { ...google, reviewCount: 0 }), false);
  });
});

describe("review helpers", () => {
  const mk = (id: string, rating: number, createdAt: string): Review => ({
    id, businessId: "b", author: "A", rating, title: "t", body: "b", createdAt,
  });
  it("sorts newest first without mutating", () => {
    const input = [mk("1", 5, "2026-01-01"), mk("2", 3, "2026-06-01")];
    assert.deepEqual(sortReviewsNewestFirst(input).map((r) => r.id), ["2", "1"]);
    assert.equal(input[0].id, "1");
  });
  it("averages to one decimal and handles empty input", () => {
    assert.equal(averageRating([mk("1", 5, "x"), mk("2", 4, "x"), mk("3", 4, "x")]), 4.3);
    assert.equal(averageRating([]), null);
  });
});
