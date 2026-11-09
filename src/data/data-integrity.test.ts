import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { benefitCategories } from "./benefit-categories.ts";
import { benefits } from "./benefits.ts";
import { businesses } from "./businesses.ts";
import { mockGoogleRatings } from "./google-ratings.ts";
import { reviews } from "./reviews.ts";
import { US_STATES } from "./us-states.ts";
import { demoAccounts, users } from "./users.ts";
import { ALL_PERMISSION_IDS } from "../lib/permissions.ts";

describe("US states", () => {
  it("covers all 50 states plus DC with unique codes", () => {
    assert.equal(US_STATES.length, 51);
    assert.equal(new Set(US_STATES.map((s) => s.code)).size, 51);
  });
});

describe("benefits dataset", () => {
  const categoryIds = new Set(benefitCategories.map((c) => c.id));
  const stateCodes = new Set(US_STATES.map((s) => s.code));

  it("has unique ids and slugs", () => {
    assert.equal(new Set(benefits.map((b) => b.id)).size, benefits.length);
    assert.equal(new Set(benefits.map((b) => b.slug)).size, benefits.length);
  });

  it("uses valid categories, scopes and state codes", () => {
    for (const b of benefits) {
      assert.ok(categoryIds.has(b.category), `${b.slug}: bad category`);
      if (b.scope === "federal") assert.equal(b.state, null, `${b.slug}: federal must have null state`);
      else assert.ok(b.state && stateCodes.has(b.state), `${b.slug}: bad state`);
    }
  });

  it("has official https source URLs and complete detail fields", () => {
    for (const b of benefits) {
      assert.match(b.sourceUrl, /^https:\/\//, `${b.slug}: sourceUrl`);
      if (b.applyUrl) assert.match(b.applyUrl, /^https:\/\//, `${b.slug}: applyUrl`);
      assert.ok(b.eligibility.length > 0 && b.howToApply.length > 0, `${b.slug}: missing eligibility/how to apply`);
    }
  });

  it("labels unreviewed records as demo and never claims a verification date for them", () => {
    for (const b of benefits) {
      if (b.dataStatus === "demo") assert.equal(b.lastVerified, undefined, b.slug);
      else assert.ok(b.lastVerified, `${b.slug}: verified records need lastVerified`);
    }
  });

  it("has federal coverage for every category and multiple states' programs", () => {
    for (const c of categoryIds) {
      assert.ok(benefits.some((b) => b.scope === "federal" && b.category === c), `no federal ${c}`);
    }
    assert.ok(new Set(benefits.flatMap((b) => (b.state ? [b.state] : []))).size >= 5);
  });
});

describe("rating demo data", () => {
  const ids = new Set(businesses.map((b) => b.id));
  const slugs = new Set(businesses.map((b) => b.slug));

  it("reviews reference real businesses and valid ratings", () => {
    assert.ok(reviews.length > 0);
    assert.equal(new Set(reviews.map((r) => r.id)).size, reviews.length);
    for (const r of reviews) {
      assert.ok(ids.has(r.businessId), r.id);
      assert.ok(r.rating >= 1 && r.rating <= 5 && Number.isInteger(r.rating), r.id);
    }
  });

  it("mock Google ratings reference real businesses and valid values", () => {
    for (const [slug, g] of Object.entries(mockGoogleRatings)) {
      assert.ok(slugs.has(slug), slug);
      assert.ok(g.rating >= 0 && g.rating <= 5 && g.reviewCount > 0, slug);
    }
  });

  it("keeps at least one business without Google data to exercise the empty state", () => {
    assert.ok(businesses.some((b) => !(b.slug in mockGoogleRatings)));
  });
});

describe("demo users", () => {
  it("has unique ids and case-insensitive unique emails", () => {
    assert.equal(new Set(users.map((u) => u.id)).size, users.length);
    assert.equal(new Set(users.map((u) => u.email.toLowerCase())).size, users.length);
  });

  it("only gives staff permissions to staff, and only Phase 1 permissions", () => {
    for (const u of users) {
      if (u.role !== "staff") assert.deepEqual(u.permissions, [], u.email);
      for (const p of u.permissions) assert.ok((ALL_PERMISSION_IDS as string[]).includes(p), `${u.email}: ${p}`);
    }
  });

  it("covers every access group, with both veteran and civilian members", () => {
    assert.ok(users.some((u) => u.role === "admin"));
    assert.ok(users.some((u) => u.role === "staff"));
    assert.ok(users.some((u) => u.role === "user" && u.userType === "veteran"));
    assert.ok(users.some((u) => u.role === "user" && u.userType === "civilian"));
    assert.ok(users.some((u) => u.status === "suspended"));
  });

  it("only attaches a branch to veterans", () => {
    for (const u of users) if (u.branch) assert.equal(u.userType, "veteran", u.email);
  });

  it("advertises only accounts that exist and are active", () => {
    for (const a of demoAccounts) {
      const u = users.find((x) => x.email === a.email);
      assert.ok(u && u.status === "active", a.email);
    }
  });
});
