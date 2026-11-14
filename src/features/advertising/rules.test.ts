import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { adProducts } from "../../lib/mock-data/advertising.ts";
import { addDaysISO, awaitingPayment, displayStatus, geoMatches, groupOf, liveCampaigns, pinSponsored, slotsAvailableOn, validateTargeting } from "./rules.ts";
import type { AdCampaign } from "../../types/index.ts";

const base: AdCampaign = {
  id: "c1", productId: "ap_featured_search", businessId: "biz_1", businessName: "One", ownerId: "u", name: "n", status: "scheduled",
  durationDays: 30, price: 100, creditApplied: 0, paymentStatus: "paid",
  targeting: { categoryIds: [], states: [], city: "", eventId: "", resourceId: "" },
  creative: { headline: "h", body: "", ctaLabel: "", ctaUrl: "", image: "", logo: "" },
  requestedStart: "2026-06-01", startDate: "2026-06-01", endDate: "2026-07-01", impressions: 0, clicks: 0, history: [], createdAt: "", updatedAt: "",
};
const c = (over: Partial<AdCampaign>): AdCampaign => ({ ...base, ...over });

describe("campaign display status", () => {
  it("derives active / scheduled / completed from dates for paid, scheduled campaigns", () => {
    assert.equal(displayStatus(base, "2026-06-15"), "active");
    assert.equal(displayStatus(base, "2026-05-30"), "scheduled");
    assert.equal(displayStatus(base, "2026-07-02"), "completed");
  });
  it("never runs a campaign that hasn't been paid for", () => {
    const unpaid = c({ paymentStatus: "unpaid" });
    assert.equal(displayStatus(unpaid, "2026-06-15"), "approved");
    assert.equal(awaitingPayment(unpaid), true);
    assert.equal(liveCampaigns([unpaid], adProducts, "2026-06-15").length, 0);
    assert.equal(liveCampaigns([base], adProducts, "2026-06-15").length, 1);
  });
  it("expires un-launched campaigns once their requested window has passed", () => {
    assert.equal(displayStatus(c({ status: "approved", paymentStatus: "unpaid", startDate: undefined, endDate: undefined }), "2026-08-01"), "expired");
    assert.equal(displayStatus(c({ status: "pending_review", paymentStatus: "unpaid", requestedStart: "2026-06-10" }), "2026-06-12"), "pending_review");
  });
  it("groups statuses for the owner's tabs", () => {
    assert.equal(groupOf("active"), "active");
    assert.equal(groupOf("changes_requested"), "pending");
    assert.equal(groupOf("approved"), "pending");
    assert.equal(groupOf("rejected"), "rejected");
  });
});

describe("inventory and targeting", () => {
  const product = adProducts.find((p) => p.id === "ap_banner")!; // 2 slots
  it("counts overlapping scheduled campaigns against the slot limit", () => {
    const a = c({ id: "a", productId: product.id });
    const b = c({ id: "b", productId: product.id, startDate: "2026-06-20", endDate: "2026-07-20" });
    assert.equal(slotsAvailableOn(product, [a], "2026-06-10", 7), 1);
    assert.equal(slotsAvailableOn(product, [a, b], "2026-06-25", 7), 0);
    assert.equal(slotsAvailableOn(product, [a, b], "2026-08-01", 7), 2);
  });
  it("requires product-specific targeting", () => {
    const t = { categoryIds: [], states: [], city: "", eventId: "", resourceId: "" };
    assert.match(validateTargeting(adProducts.find((p) => p.kind === "featured_category")!, t) ?? "", /category/i);
    assert.match(validateTargeting(adProducts.find((p) => p.kind === "geo_sponsorship")!, t) ?? "", /state/i);
    assert.match(validateTargeting(adProducts.find((p) => p.kind === "event_sponsorship")!, t) ?? "", /event/i);
    assert.equal(validateTargeting(adProducts.find((p) => p.kind === "premium_banner")!, t), null);
  });
  it("adds days across month boundaries", () => {
    assert.equal(addDaysISO("2026-01-31", 30), "2026-03-02");
  });
  it("matches a typed location to sponsored states or cities", () => {
    const t = { categoryIds: [], states: ["TX"], city: "Austin", eventId: "", resourceId: "" };
    assert.equal(geoMatches("Dallas, TX", t, { TX: "Texas" }), true);
    assert.equal(geoMatches("texas", t, { TX: "Texas" }), true);
    assert.equal(geoMatches("Austin", t, {}), true);
    assert.equal(geoMatches("Denver, CO", t, { TX: "Texas" }), false);
    assert.equal(geoMatches("", t, { TX: "Texas" }), false);
  });
});

describe("sponsored pinning", () => {
  const results = [
    { id: "b1", category: "food-drink", state: "NC" },
    { id: "b2", category: "technology", state: "CO" },
    { id: "b3", category: "food-drink", state: "NC" },
  ];
  const live = (over: Partial<AdCampaign>, kind: "ap_featured_search" | "ap_featured_category") => ({
    campaign: c({ businessId: "b3", productId: kind, ...over }),
    product: adProducts.find((p) => p.id === kind)!,
  });
  it("moves a sponsored business to the top and reports it for labelling", () => {
    const out = pinSponsored(results, [live({}, "ap_featured_search")], { category: "" });
    assert.deepEqual(out.list.map((r) => r.id), ["b3", "b1", "b2"]);
    assert.deepEqual([...out.sponsoredIds], ["b3"]);
  });
  it("never injects a business that doesn't match the visitor's filters", () => {
    const out = pinSponsored(results, [live({ businessId: "not-in-results" }, "ap_featured_search")], { category: "" });
    assert.deepEqual(out.list.map((r) => r.id), ["b1", "b2", "b3"]);
    assert.equal(out.sponsoredIds.size, 0);
  });
  it("only shows category placements when browsing that category", () => {
    const cat = live({ targeting: { categoryIds: ["food-drink"], states: [], city: "", eventId: "", resourceId: "" } }, "ap_featured_category");
    assert.equal(pinSponsored(results, [cat], { category: "" }).sponsoredIds.size, 0);
    assert.equal(pinSponsored(results, [cat], { category: "food-drink" }).sponsoredIds.size, 1);
  });
  it("respects category / state targeting on the campaign", () => {
    const wrongState = live({ targeting: { categoryIds: [], states: ["TX"], city: "", eventId: "", resourceId: "" } }, "ap_featured_search");
    assert.equal(pinSponsored(results, [wrongState], { category: "" }).sponsoredIds.size, 0);
  });
});
