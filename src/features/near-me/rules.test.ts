import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPlaces, distanceMiles, formatMiles, isZip, nearby } from "./rules.ts";
import { businesses } from "../../data/businesses.ts";
import { organizations, zipCentroids } from "../../lib/mock-data/organizations.ts";

const fayetteville = zipCentroids["28301"];
// data/events.ts uses path aliases Node can't resolve here, so one local event stands in for the seed list.
const event = {
  id: "ev_t", slug: "muster", title: "Veterans Muster", category: "Community", summary: "", description: "", agenda: [], date: "2026-12-01", startTime: "10:00", endTime: "12:00",
  venue: "Festival Park", address: "", city: "Fayetteville", state: "NC", lat: 35.055, lng: -78.88, image: "", organizer: "", price: "Free", capacity: 100, registered: 0, status: "published" as const, createdAt: "2026-01-01",
};
const places = buildPlaces({ businesses, events: [event, { ...event, id: "ev_online", city: "Online" }, { ...event, id: "ev_past", date: "2025-01-01" }], organizations, today: "2026-01-01" });

describe("Near Me (client update §3)", () => {
  it("computes great-circle distance", () => {
    // Fayetteville NC → Colorado Springs CO is roughly 1,500 miles.
    const d = distanceMiles(fayetteville, zipCentroids["80903"]);
    assert.ok(d > 1400 && d < 1600, String(d));
    assert.equal(Math.round(distanceMiles(fayetteville, fayetteville)), 0);
  });
  it("finds every kind of place near a ZIP, nearest first, within the radius", () => {
    const r = nearby(places, fayetteville, 25);
    assert.ok(r.length >= 5);
    assert.ok(r.every((p) => p.miles <= 25));
    for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].miles <= r[i].miles);
    const kinds = new Set(r.map((p) => p.kind));
    for (const k of ["veteran_owned", "veteran_friendly", "event", "vfw_post", "american_legion", "nonprofit", "community_resource"]) assert.ok(kinds.has(k as never), k);
    assert.ok(!r.some((p) => p.id === "ev_online" || p.id === "ev_past"), "online and past events are skipped");
  });
  it("10 miles is a subset of 25 miles", () => {
    const ten = nearby(places, fayetteville, 10).map((p) => p.id);
    const twentyFive = nearby(places, fayetteville, 25).map((p) => p.id);
    assert.ok(ten.length < twentyFive.length);
    assert.ok(ten.every((id) => twentyFive.includes(id)));
  });
  it("filters by kind and lists community-resource businesses as such", () => {
    const r = nearby(places, zipCentroids["78205"], 25, ["community_resource", "nonprofit"]);
    assert.ok(r.every((p) => p.kind === "community_resource" || p.kind === "nonprofit"));
    const meridianKind = places.find((p) => p.name === "Meridian Legal Advisory")?.kind;
    assert.equal(meridianKind, "community_resource");
  });
  it("validates ZIPs and formats distances", () => {
    assert.equal(isZip("28301"), true);
    assert.equal(isZip("2830"), false);
    assert.equal(formatMiles(3.456), "3.5 mi");
    assert.equal(formatMiles(14.6), "15 mi");
  });
});
