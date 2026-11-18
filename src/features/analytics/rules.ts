/**
 * Administrative analytics (client update §7B). Pure: date ranges, listing activity per employee and appointment
 * metrics. Feed it whatever the API returns; the same functions work on the demo stores.
 */
import type { Appointment, AuditEntry, Business } from "../../types/index.ts";

export type RangePreset = "today" | "week" | "month" | "year" | "all" | "custom";

export interface DateRange {
  from: string; // ISO date, inclusive
  to: string; // ISO date, inclusive
}

const parse = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Calendar ranges: this week starts Monday; "all" spans everything. */
export function rangeFor(preset: Exclude<RangePreset, "custom">, today: string): DateRange {
  const t = parse(today);
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "week": {
      const day = (t.getUTCDay() + 6) % 7; // Monday = 0
      const start = new Date(t);
      start.setUTCDate(t.getUTCDate() - day);
      return { from: iso(start), to: today };
    }
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    case "all":
      return { from: "0000-01-01", to: "9999-12-31" };
  }
}

export const inRange = (date: string | undefined, r: DateRange) => !!date && date.slice(0, 10) >= r.from && date.slice(0, 10) <= r.to;

export interface EmployeeActivity {
  employeeId: string;
  added: string[]; // business ids
  updated: string[]; // business ids (distinct)
}

export interface ListingActivity {
  totalListings: number;
  addedInRange: string[];
  byEmployee: EmployeeActivity[];
}

/**
 * Who added and updated listings in a range. "Updated" counts distinct businesses per employee, from the change log
 * plus each listing's last-updated stamp (seed data predates the log).
 */
export function listingActivity(businesses: Business[], audit: AuditEntry[], range: DateRange): ListingActivity {
  const added = businesses.filter((b) => inRange(b.createdAt, range));
  const map = new Map<string, { added: Set<string>; updated: Set<string> }>();
  const slot = (id: string) => {
    if (!map.has(id)) map.set(id, { added: new Set(), updated: new Set() });
    return map.get(id)!;
  };
  for (const b of added) if (b.createdBy) slot(b.createdBy).added.add(b.id);
  for (const b of businesses) if (b.updatedBy && inRange(b.updatedAt, range)) slot(b.updatedBy).updated.add(b.id);
  for (const e of audit) {
    if (e.area !== "businesses" || !inRange(e.at, range)) continue;
    if (e.action === "updated listing") slot(e.actorId).updated.add(e.targetId);
    if (e.action === "added listing") slot(e.actorId).added.add(e.targetId);
  }
  return {
    totalListings: businesses.length,
    addedInRange: added.map((b) => b.id),
    byEmployee: [...map.entries()]
      .map(([employeeId, v]) => ({ employeeId, added: [...v.added], updated: [...v.updated] }))
      .sort((a, b) => b.added.length + b.updated.length - (a.added.length + a.updated.length)),
  };
}

export interface AppointmentMetrics {
  requested: Appointment[]; // created in range
  upcoming: Appointment[]; // still to happen (requested / confirmed, from today on)
  completed: Appointment[]; // held in range
  cancelled: Appointment[]; // scheduled in range
  byType: { label: string; value: number }[];
  byEmployee: { employeeId: string | null; value: number }[];
  /** Appointments scheduled per day (or per month for ranges over 62 days). */
  series: { label: string; value: number }[];
}

const countBy = <T,>(list: T[], key: (x: T) => string) =>
  [...list.reduce((m, x) => m.set(key(x), (m.get(key(x)) ?? 0) + 1), new Map<string, number>()).entries()];

export function appointmentMetrics(appts: Appointment[], range: DateRange, today: string): AppointmentMetrics {
  const scheduled = appts.filter((a) => inRange(a.date, range));
  const span = range.from === "0000-01-01" ? Infinity : (parse(range.to).getTime() - parse(range.from).getTime()) / 86400000;
  const bucket = (d: string) => (span > 62 ? d.slice(0, 7) : d);
  return {
    requested: appts.filter((a) => inRange(a.createdAt, range)),
    upcoming: appts.filter((a) => (a.status === "requested" || a.status === "confirmed") && a.date >= today).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    completed: scheduled.filter((a) => a.status === "completed"),
    cancelled: scheduled.filter((a) => a.status === "cancelled"),
    byType: countBy(scheduled, (a) => a.topic).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
    byEmployee: countBy(scheduled, (a) => a.assignedTo ?? "").map(([id, value]) => ({ employeeId: id || null, value })).sort((a, b) => b.value - a.value),
    series: countBy(scheduled, (a) => bucket(a.date)).map(([label, value]) => ({ label, value })).sort((a, b) => a.label.localeCompare(b.label)),
  };
}
