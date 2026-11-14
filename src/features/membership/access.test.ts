import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { plans } from "../../lib/mock-data/membership.ts";
import { featureDefs } from "../../lib/mock-data/membership.ts";
import { subscriptions } from "../../lib/mock-data/subscriptions.ts";
import {
  annualSavingsPercent, cheapestPlanWith, describeSubscription, freePlan, hasFeature, limitOf, planChange, plansFor, resolvePlan, usageState,
} from "./access.ts";
import type { Subscription } from "../../types/index.ts";

const sub = (over: Partial<Subscription>): Subscription => ({
  id: "s", audience: "business", subjectId: "biz_x", ownerId: "u", planId: "plan_biz_pro", cycle: "monthly", status: "active",
  startedOn: "2026-01-01", renewsOn: "2027-01-01", cancelAtPeriodEnd: false, scheduledPlanId: null, ...over,
});

describe("membership plans mock data", () => {
  it("has the required tiers per audience", () => {
    const names = (a: Parameters<typeof plansFor>[1]) => plansFor(plans, a).map((p) => p.name);
    assert.deepEqual(names("veteran"), ["Free", "Plus", "Pro"]);
    assert.deepEqual(names("civilian"), ["Free", "Plus", "Pro"]);
    assert.deepEqual(names("business"), ["Free", "Growth", "Pro", "Executive"]);
  });

  it("every plan only references features of its own audience, and defines all of them", () => {
    for (const p of plans) {
      const allowed = featureDefs.filter((f) => f.audiences.includes(p.audience)).map((f) => f.id).sort();
      assert.deepEqual(Object.keys(p.features).sort(), allowed, p.id);
    }
  });

  it("essential features (public search, resources, listing) are on for every plan", () => {
    for (const p of plans) for (const f of featureDefs) if (f.essential && f.audiences.includes(p.audience)) assert.equal(hasFeature(p, f.id), true, `${p.id}:${f.id}`);
  });

  it("free plans cost nothing and paid plans are cheaper annually than 12 months", () => {
    for (const p of plans) {
      if (p.monthlyPrice === 0) assert.equal(p.annualPrice, 0, p.id);
      else assert.ok(p.annualPrice > 0 && p.annualPrice <= p.monthlyPrice * 12, p.id);
    }
  });

  it("higher tiers never offer less than lower tiers", () => {
    for (const a of ["veteran", "civilian", "business"] as const) {
      const list = plansFor(plans, a);
      for (let i = 1; i < list.length; i++) {
        for (const f of featureDefs.filter((d) => d.audiences.includes(a))) {
          const lo = limitOf(list[i - 1], f.id);
          const hi = limitOf(list[i], f.id);
          if (hi === null) continue;
          assert.ok(lo !== null && hi >= lo, `${list[i].id} < ${list[i - 1].id} on ${f.id}`);
        }
      }
    }
  });

  it("no plan feature or advertising allowance can grant a verification badge", () => {
    for (const f of featureDefs) assert.ok(!/badge|verif/i.test(`${f.id} ${f.label}`), f.id);
    for (const p of plans) for (const id of Object.keys(p.adAllowances)) assert.ok(!/badge|verif/i.test(id), id);
  });

  it("seed subscriptions point at real plans of the same audience", () => {
    for (const s of subscriptions) assert.equal(plans.find((p) => p.id === s.planId)?.audience, s.audience, s.id);
  });
});

describe("plan resolution", () => {
  it("falls back to Free without a subscription, or when it has ended", () => {
    assert.equal(resolvePlan(plans, [], "business", "biz_x")?.id, freePlan(plans, "business")?.id);
    assert.equal(resolvePlan(plans, [sub({ status: "canceled" })], "business", "biz_x")?.name, "Free");
    assert.equal(resolvePlan(plans, [sub({ status: "expired" })], "business", "biz_x")?.name, "Free");
  });
  it("keeps paid features while a payment is past due (grace period)", () => {
    assert.equal(resolvePlan(plans, [sub({ status: "past_due" })], "business", "biz_x")?.name, "Pro");
  });
  it("classifies upgrades and downgrades by plan order", () => {
    const [free, growth, pro] = plansFor(plans, "business");
    assert.equal(planChange(growth, pro), "upgrade");
    assert.equal(planChange(growth, free), "downgrade");
    assert.equal(planChange(growth, growth), "current");
  });
});

describe("limits and usage", () => {
  const exec = plans.find((p) => p.id === "plan_biz_exec");
  const free = plans.find((p) => p.id === "plan_biz_free");
  it("distinguishes unlimited from not-included from capped", () => {
    assert.equal(limitOf(exec, "business_photos"), null);
    assert.equal(limitOf(free, "promotions"), 0);
    assert.equal(limitOf(free, "business_photos"), 3);
  });
  it("reports when a cap is reached", () => {
    assert.equal(usageState(free, "business_photos", 3).atLimit, true);
    assert.equal(usageState(free, "business_photos", 2).remaining, 1);
    assert.equal(usageState(exec, "business_photos", 500).atLimit, false);
    assert.equal(usageState(free, "promotions", 0).included, false);
  });
  it("finds the cheapest plan that unlocks a feature", () => {
    assert.equal(cheapestPlanWith(plans, "business", "analytics_trends")?.name, "Growth");
    assert.equal(cheapestPlanWith(plans, "business", "analytics_export")?.name, "Executive");
  });
});

describe("pricing helpers", () => {
  it("computes the annual saving", () => {
    assert.equal(annualSavingsPercent({ monthlyPrice: 29, annualPrice: 290 } as never), 17);
    assert.equal(annualSavingsPercent({ monthlyPrice: 0, annualPrice: 0 } as never), 0);
  });
  it("labels subscription states", () => {
    assert.equal(describeSubscription(undefined).label, "Free plan");
    assert.equal(describeSubscription(sub({ cancelAtPeriodEnd: true })).tone, "warn");
    assert.equal(describeSubscription(sub({ status: "past_due" })).tone, "bad");
  });
});
