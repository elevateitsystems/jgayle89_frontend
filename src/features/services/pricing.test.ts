import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { describePromotion, discountFor, promotionApplies, purchaseBlock, quote } from "./pricing.ts";
import type { ServiceListing, ServicePromotion } from "../../types/index.ts";

const svc = (p: Partial<ServiceListing> = {}): ServiceListing => ({
  id: "svc_resume", audience: "member", name: "Résumé writing", shortDescription: "", description: "", price: 150, priceUnit: "one-time",
  included: [], eligiblePlanIds: ["free", "plus", "pro"], availability: "active", sortOrder: 1, createdAt: "", ...p,
});
const promo = (p: Partial<ServicePromotion> = {}): ServicePromotion => ({
  id: "p", name: "Promo", kind: "percent_off", value: 10, couponCode: "", planIds: [], serviceIds: [], startsOn: "2026-01-01",
  active: true, approval: "approved", createdAt: "", ...p,
});
const today = "2026-11-18";

describe("services marketplace (client update §6)", () => {
  it("lets Free members buy eligible services but not Coming Soon / inactive / ineligible ones", () => {
    assert.equal(purchaseBlock(svc(), "free"), null);
    assert.equal(purchaseBlock(svc({ availability: "coming_soon" }), "pro"), "coming_soon");
    assert.equal(purchaseBlock(svc({ availability: "inactive" }), "pro"), "inactive");
    assert.equal(purchaseBlock(svc({ eligiblePlanIds: ["pro"] }), "free"), "not_eligible");
  });

  it("supports every promotion type", () => {
    const s = svc();
    assert.equal(discountFor({ kind: "percent_off", value: 10 }, s), 15);
    assert.equal(discountFor({ kind: "amount_off", value: 25 }, s), 25);
    assert.equal(discountFor({ kind: "free_consultation", value: 0 }, s), 150);
    assert.equal(discountFor({ kind: "member_price", value: 99 }, s), 51);
    assert.equal(discountFor({ kind: "free_months", value: 1 }, svc({ price: 40, priceUnit: "per month" })), 40);
    assert.equal(discountFor({ kind: "free_months", value: 1 }, s), 0, "one month free only applies to monthly services");
    assert.equal(discountFor({ kind: "amount_off", value: 500 }, s), 150, "never below zero");
    assert.equal(describePromotion({ kind: "amount_off", value: 25 }), "$25 off");
  });

  it("scopes promotions by tier, service and promotional period", () => {
    assert.equal(promotionApplies(promo({ planIds: ["pro"] }), { serviceId: "svc_resume", planId: "free", today }), false);
    assert.equal(promotionApplies(promo({ planIds: ["pro"] }), { serviceId: "svc_resume", planId: "pro", today }), true);
    assert.equal(promotionApplies(promo({ serviceIds: ["other"] }), { serviceId: "svc_resume", today }), false);
    assert.equal(promotionApplies(promo({ endsOn: "2026-10-01" }), { serviceId: "svc_resume", today }), false);
    assert.equal(promotionApplies(promo({ startsOn: "2026-12-01" }), { serviceId: "svc_resume", today }), false);
    assert.equal(promotionApplies(promo({ approval: "pending" }), { serviceId: "svc_resume", today }), false, "staff requests need approval first");
  });

  it("applies the single best promotion; coupons must match", () => {
    const promos = [promo({ id: "auto10", value: 10 }), promo({ id: "c25", kind: "amount_off", value: 25, couponCode: "SALUTE25" })];
    assert.equal(quote(svc(), promos, { today }).promotion?.id, "auto10");
    const withCoupon = quote(svc(), promos, { today, coupon: "salute25" });
    assert.equal(withCoupon.promotion?.id, "c25");
    assert.equal(withCoupon.total, 125);
    assert.equal(quote(svc(), promos, { today, coupon: "NOPE" }).couponRejected, true);
  });

  it("gives paid tiers member-exclusive pricing while Free pays list price", () => {
    const promos = [promo({ kind: "member_price", value: 120, planIds: ["plus", "pro"] })];
    assert.equal(quote(svc(), promos, { today, planId: "free" }).total, 150);
    assert.equal(quote(svc(), promos, { today, planId: "plus" }).total, 120);
  });
});
