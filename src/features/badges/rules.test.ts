import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { businesses } from "../../data/businesses.ts";
import { badgeAssignments, badgeRequests, badges } from "../../lib/mock-data/badges.ts";
import { filterBusinesses, defaultFilters } from "../../lib/business-filters.ts";
import { activeBadgeIds, badgeState, badgesFor, hasAllBadges } from "./rules.ts";

describe("badges", () => {
  it("defines the five required badge types", () => {
    assert.deepEqual(badges.map((b) => b.name), ["Verified Business", "Vet Owned", "Vet Friendly", "First Responder Owned", "Vet / First Responder Discount"]);
  });
  it("ignores revoked assignments", () => {
    assert.ok(!activeBadgeIds(badgeAssignments, "biz_017").includes("badge_vet_owned"));
    assert.ok(activeBadgeIds(badgeAssignments, "biz_001").includes("badge_verified"));
  });
  it("hides inactive badge types from public display", () => {
    const off = badges.map((b) => (b.id === "badge_verified" ? { ...b, active: false } : b));
    assert.ok(!badgesFor(off, badgeAssignments, "biz_001").some((b) => b.id === "badge_verified"));
    assert.ok(badgesFor(off, badgeAssignments, "biz_001", { includeInactive: true }).some((b) => b.id === "badge_verified"));
  });
  it("derives the owner's per-badge state", () => {
    assert.equal(badgeState("badge_verified", "biz_001", badgeAssignments, badgeRequests), "active");
    assert.equal(badgeState("badge_vet_owned", "biz_003", badgeAssignments, badgeRequests), "pending");
    assert.equal(badgeState("badge_fr_owned", "biz_012", badgeAssignments, badgeRequests), "rejected");
    assert.equal(badgeState("badge_vet_owned", "biz_017", badgeAssignments, badgeRequests), "revoked");
    assert.equal(badgeState("badge_vet_friendly", "biz_001", badgeAssignments, badgeRequests), "none");
  });
  it("requires ALL selected badges (AND filter)", () => {
    assert.equal(hasAllBadges(["a", "b"], ["a"]), true);
    assert.equal(hasAllBadges(["a"], ["a", "b"]), false);
    assert.equal(hasAllBadges([], []), true);
  });
  it("seed data never gives a badge to a business that doesn't exist, or a request to a non-owner", () => {
    for (const a of badgeAssignments) assert.ok(businesses.some((b) => b.id === a.businessId), a.id);
    for (const r of badgeRequests) assert.equal(businesses.find((b) => b.id === r.businessId)?.ownerId, r.requesterId, r.id);
  });
});

describe("directory filters: badges and hiring", () => {
  const idsFor = (id: string) => activeBadgeIds(badgeAssignments, id);
  const active = businesses.filter((b) => b.status === "active");
  it("filters by hiring status", () => {
    const out = filterBusinesses(active, { ...defaultFilters, hiring: true });
    assert.ok(out.length > 0 && out.every((b) => b.hiring));
  });
  it("filters by one badge, and narrows when more are added", () => {
    const vet = filterBusinesses(active, { ...defaultFilters, badges: ["badge_vet_owned"] }, () => "", idsFor);
    const both = filterBusinesses(active, { ...defaultFilters, badges: ["badge_vet_owned", "badge_discount"] }, () => "", idsFor);
    assert.ok(vet.length > both.length && both.length > 0);
    assert.ok(both.every((b) => idsFor(b.id).includes("badge_discount") && idsFor(b.id).includes("badge_vet_owned")));
  });
  it("combines badge and hiring filters", () => {
    const out = filterBusinesses(active, { ...defaultFilters, hiring: true, badges: ["badge_vet_owned"] }, () => "", idsFor);
    assert.ok(out.every((b) => b.hiring && idsFor(b.id).includes("badge_vet_owned")));
  });
});
