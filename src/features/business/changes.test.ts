import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { businesses } from "../../data/businesses.ts";
import { editRequests } from "../../lib/mock-data/edit-requests.ts";
import { changedKeys, describeValue, editableSnapshot, effectiveChanges, summarizeChanges } from "./changes.ts";

const b = businesses.find((x) => x.id === "biz_001")!;

describe("edit request diffs", () => {
  it("drops fields that equal the live listing", () => {
    const snap = editableSnapshot(b);
    assert.deepEqual(effectiveChanges(snap, { name: b.name, tagline: b.tagline }), {});
    assert.deepEqual(effectiveChanges(snap, { name: b.name, phone: "(555) 000-0000" }), { phone: "(555) 000-0000" });
  });
  it("treats identical arrays as unchanged and different ones as changed", () => {
    const snap = editableSnapshot(b);
    assert.deepEqual(effectiveChanges(snap, { services: [...b.services] }), {});
    assert.deepEqual(changedKeys(effectiveChanges(snap, { services: [...b.services, "New"] })), ["services"]);
  });
  it("summarises and describes changes for humans", () => {
    assert.equal(summarizeChanges({ hours: "x", phone: "y" }), "Hours & Phone");
    assert.equal(summarizeChanges({ hours: "x", phone: "y", name: "z" }), "Hours, Phone +1 more");
    assert.equal(describeValue("services", ["a", "b"]), "a, b");
    assert.equal(describeValue("website", ""), "—");
  });
});

describe("edit request seed data", () => {
  it("only references businesses their requester owns", () => {
    for (const r of editRequests) assert.equal(businesses.find((x) => x.id === r.businessId)?.ownerId, r.requesterId, r.id);
  });
  it("snapshots the current value for every field being changed", () => {
    for (const r of editRequests) assert.deepEqual(Object.keys(r.before).sort(), Object.keys(r.changes).sort(), r.id);
  });
  it("only touches owner-editable fields", () => {
    const editable = new Set(Object.keys(editableSnapshot(b)));
    for (const r of editRequests) for (const k of Object.keys(r.changes)) assert.ok(editable.has(k), `${r.id}: ${k}`);
  });
  it("owners never appear as their own reviewer", () => {
    for (const r of editRequests) assert.notEqual(r.reviewerName, r.requesterName, r.id);
  });
});
