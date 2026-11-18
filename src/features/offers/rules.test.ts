import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  awaitingFrom, countdownTo, countsAgainstAllowance, filterFreebies, isFreebieLive, offerDisplayStatus, requiredApprovals, statusAfterApprovals,
} from "./rules.ts";
import type { BusinessOffer, Freebie } from "../../types/index.ts";

const freebie = (p: Partial<Freebie>): Freebie => ({
  id: "f", slug: "f", title: "Free coffee", company: "Acme", category: "veteran_freebies", summary: "A free cup", eligibility: "Veterans",
  offerDetails: "Free", url: "https://acme.example", active: true, createdAt: "2026-01-01", updatedAt: "2026-01-01", ...p,
});
const offer = (p: Partial<BusinessOffer>): BusinessOffer => ({
  id: "o", businessId: "b", title: "15% off", discountText: "15% off", description: "", audience: "veterans", startsOn: "2026-11-01",
  status: "pending", origin: "owner", createdById: "u", createdByName: "U", requires: ["staff"], approvedBy: {}, history: [],
  createdAt: "", updatedAt: "", ...p,
});

describe("freebies directory", () => {
  it("hides inactive and expired listings", () => {
    assert.equal(isFreebieLive(freebie({}), "2026-11-18"), true);
    assert.equal(isFreebieLive(freebie({ active: false }), "2026-11-18"), false);
    assert.equal(isFreebieLive(freebie({ expiresOn: "2026-11-17" }), "2026-11-18"), false);
    assert.equal(isFreebieLive(freebie({ expiresOn: "2026-11-18" }), "2026-11-18"), true, "still live on its last day");
  });
  it("searches by keyword and category, soonest-ending first", () => {
    const list = [freebie({ id: "a", title: "Zoo pass", expiresOn: "2026-12-31" }), freebie({ id: "b", title: "Hardware discount", category: "military_discounts" }), freebie({ id: "c", title: "Free meal", expiresOn: "2026-11-20" })];
    assert.deepEqual(filterFreebies(list, { q: "", category: "" }, "2026-11-18").map((x) => x.id), ["c", "a", "b"]);
    assert.deepEqual(filterFreebies(list, { q: "hardware", category: "" }, "2026-11-18").map((x) => x.id), ["b"]);
    assert.deepEqual(filterFreebies(list, { q: "", category: "military_discounts" }, "2026-11-18").map((x) => x.id), ["b"]);
  });
});

describe("business offer approvals (admin-configurable)", () => {
  it("treats the submitter as approving their own side", () => {
    assert.deepEqual(requiredApprovals("staff", "owner"), ["staff"]);
    assert.deepEqual(requiredApprovals("staff", "staff"), []);
    assert.deepEqual(requiredApprovals("owner", "staff"), ["owner"]);
    assert.deepEqual(requiredApprovals("owner", "owner"), []);
    assert.deepEqual(requiredApprovals("both", "owner"), ["staff"]);
    assert.deepEqual(requiredApprovals("both", "staff"), ["owner"]);
  });
  it("stays pending until every required approval is in", () => {
    const o = offer({ requires: ["staff"], approvedBy: {} });
    assert.equal(statusAfterApprovals(o, "2026-11-18"), "pending");
    assert.deepEqual(awaitingFrom(o), ["staff"]);
    assert.equal(statusAfterApprovals({ ...o, approvedBy: { staff: "Sam" } }, "2026-11-18"), "published");
  });
  it("approved offers wait for their start date, then publish", () => {
    const o = offer({ requires: [], startsOn: "2026-12-01", status: "pending" });
    assert.equal(statusAfterApprovals(o, "2026-11-18"), "approved");
    assert.equal(offerDisplayStatus({ ...o, status: "approved" }, "2026-11-18"), "approved");
    assert.equal(offerDisplayStatus({ ...o, status: "approved" }, "2026-12-01"), "published");
  });
  it("rejected/inactive offers never publish, expired ones stop counting", () => {
    assert.equal(statusAfterApprovals(offer({ status: "rejected", requires: [] }), "2026-11-18"), "rejected");
    const expired = offer({ status: "published", expiresOn: "2026-11-10" });
    assert.equal(offerDisplayStatus(expired, "2026-11-18"), "expired");
    assert.equal(countsAgainstAllowance(expired, "2026-11-18"), false);
    assert.equal(countsAgainstAllowance(offer({ status: "pending" }), "2026-11-18"), true);
  });
});

describe("countdown", () => {
  it("counts to the end of the last day", () => {
    const c = countdownTo("2026-11-20", new Date(2026, 10, 18, 23, 59, 59, 999));
    assert.equal(c.ended, false);
    assert.equal(c.days, 2);
    assert.equal(countdownTo("2026-11-17", new Date(2026, 10, 18)).ended, true);
  });
});
