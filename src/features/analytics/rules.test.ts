import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { appointmentMetrics, inRange, listingActivity, rangeFor } from "./rules.ts";
import type { Appointment, AuditEntry, Business } from "../../types/index.ts";

const biz = (id: string, p: Partial<Business>) => ({ id, createdAt: "2026-01-01", ...p }) as Business;
const appt = (id: string, p: Partial<Appointment>): Appointment => ({ id, userId: "u", topic: "Benefits review", mode: "video", date: "2026-11-10", time: "10:00", notes: "", status: "completed", createdAt: "2026-11-01T00:00:00Z", ...p });

describe("admin analytics (client update §7B)", () => {
  it("builds today / this week / this month / custom ranges", () => {
    assert.deepEqual(rangeFor("today", "2026-11-18"), { from: "2026-11-18", to: "2026-11-18" });
    assert.deepEqual(rangeFor("week", "2026-11-18"), { from: "2026-11-16", to: "2026-11-18" }, "Wednesday → back to Monday");
    assert.deepEqual(rangeFor("month", "2026-11-18"), { from: "2026-11-01", to: "2026-11-18" });
    assert.equal(inRange("2026-11-18T23:00:00Z", { from: "2026-11-18", to: "2026-11-18" }), true);
  });

  it("counts businesses added and updated by each employee in a range", () => {
    const businesses = [
      biz("b1", { createdAt: "2026-11-17", createdBy: "staff1" }),
      biz("b2", { createdAt: "2026-11-02", createdBy: "staff2", updatedBy: "staff1", updatedAt: "2026-11-17" }),
      biz("b3", { createdAt: "2026-06-01", createdBy: "staff1" }),
    ];
    const audit: AuditEntry[] = [
      { id: "a", at: "2026-11-18T10:00:00Z", actorId: "staff2", actorName: "S2", area: "businesses", action: "updated listing", targetId: "b3", targetName: "B3" },
      { id: "b", at: "2026-11-18T11:00:00Z", actorId: "staff2", actorName: "S2", area: "businesses", action: "updated listing", targetId: "b3", targetName: "B3" },
    ];
    const week = listingActivity(businesses, audit, rangeFor("week", "2026-11-18"));
    assert.equal(week.totalListings, 3);
    assert.deepEqual(week.addedInRange, ["b1"]);
    const s1 = week.byEmployee.find((e) => e.employeeId === "staff1")!;
    const s2 = week.byEmployee.find((e) => e.employeeId === "staff2")!;
    assert.deepEqual(s1.added, ["b1"]);
    assert.deepEqual(s1.updated, ["b2"]);
    assert.deepEqual(s2.updated, ["b3"], "repeat edits to one listing count once");
    const month = listingActivity(businesses, audit, rangeFor("month", "2026-11-18"));
    assert.deepEqual(month.addedInRange.sort(), ["b1", "b2"]);
  });

  it("summarises appointments by status, type, employee and day", () => {
    const list = [
      appt("1", { status: "completed", assignedTo: "s1", date: "2026-11-10" }),
      appt("2", { status: "cancelled", assignedTo: "s1", date: "2026-11-11", topic: "Career coaching" }),
      appt("3", { status: "confirmed", assignedTo: "s2", date: "2026-11-20", createdAt: "2026-11-17T00:00:00Z" }),
      appt("4", { status: "requested", date: "2026-11-25", createdAt: "2026-11-18T00:00:00Z" }),
      appt("5", { status: "completed", date: "2026-09-01" }),
    ];
    const m = appointmentMetrics(list, rangeFor("month", "2026-11-18"), "2026-11-18");
    assert.equal(m.completed.length, 1);
    assert.equal(m.cancelled.length, 1);
    assert.deepEqual(m.upcoming.map((a) => a.id), ["3", "4"]);
    assert.equal(m.requested.length, 5, "all were created this month in the fixture except none outside");
    assert.deepEqual(m.byType[0], { label: "Benefits review", value: 1 });
    assert.equal(m.byEmployee.find((e) => e.employeeId === "s1")?.value, 2);
    assert.deepEqual(m.series.map((s) => s.label), ["2026-11-10", "2026-11-11"]);
    const custom = appointmentMetrics(list, { from: "2026-11-20", to: "2026-11-30" }, "2026-11-18");
    assert.equal(custom.byType.reduce((a, b) => a + b.value, 0), 2);
  });
});
