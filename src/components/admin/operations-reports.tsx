"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CalendarCheck, CalendarClock, CalendarX, CheckCircle2, Store, Users } from "lucide-react";
import { AdminBusinessLink, AdminMemberLink } from "./entity-links";
import { BarChart, HBarList } from "./charts";
import { Panel, StatCard } from "@/components/dashboard/panel";
import { Input } from "@/components/ui/input";
import { appointmentMetrics, listingActivity, rangeFor, type DateRange, type RangePreset } from "@/features/analytics/rules";
import { useBusinesses } from "@/hooks/use-businesses";
import { useStore } from "@/hooks/use-store";
import { formatDate, todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import { auditStore } from "@/services/audit-service";
import { appointmentStore } from "@/services/member-service";
import { userStore } from "@/services/user-service";

const PRESETS: { id: RangePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "all", label: "All time" },
  { id: "custom", label: "Custom" },
];

/**
 * Admin → Reports: employee activity and operational reports (client update §7B). Every number links through
 * to the businesses, members or appointments behind it.
 */
export function OperationsReports() {
  const today = todayISO();
  const [preset, setPreset] = useState<RangePreset>("month");
  const [custom, setCustom] = useState<DateRange>({ from: rangeFor("month", today).from, to: today });
  const range = preset === "custom" ? custom : rangeFor(preset, today);
  const { businesses } = useBusinesses();
  const audit = useStore(auditStore);
  const appts = useStore(appointmentStore);
  const users = useStore(userStore);
  const nameOf = (id: string | null) => (id ? users.find((u) => u.id === id)?.name ?? id : "Unassigned");

  const listings = useMemo(() => listingActivity(businesses, audit, range), [businesses, audit, range]);
  const metrics = useMemo(() => appointmentMetrics(appts, range, today), [appts, range, today]);
  const qs = (extra: Record<string, string>) => {
    const p = new URLSearchParams(preset === "all" ? extra : { from: range.from, to: range.to, ...extra });
    return `/admin/appointments?${p}`;
  };

  return (
    <div className="space-y-6">
      <section aria-label="Date range" className="flex flex-wrap items-end gap-2 rounded-lg border bg-card p-4 shadow-card">
        <div role="group" aria-label="Range" className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button key={p.id} type="button" aria-pressed={preset === p.id} onClick={() => setPreset(p.id)} className={cn("h-9 rounded-md border px-3 text-sm font-medium", preset === p.id ? "border-olive-700 bg-olive-700 text-white" : "border-input bg-white hover:bg-sand-100")}>
              {p.label}
            </button>
          ))}
        </div>
        {preset === "custom" && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-medium text-muted-foreground">From<Input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="mt-1 h-9" /></label>
            <label className="text-xs font-medium text-muted-foreground">To<Input type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="mt-1 h-9" /></label>
          </div>
        )}
        <p className="ml-auto text-xs text-muted-foreground">{preset === "all" ? "All time" : `${formatDate(range.from)} – ${formatDate(range.to)}`}</p>
      </section>

      <h2 className="text-xl font-semibold text-olive-950">Business listing activity</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Businesses in the directory" value={listings.totalListings} hint="All statuses" icon={Store} href="/admin/businesses" />
        <StatCard label="Added in this period" value={listings.addedInRange.length} hint={preset === "all" ? "All time" : PRESETS.find((p) => p.id === preset)?.label ?? ""} icon={Store} />
        <StatCard label="Employees active" value={listings.byEmployee.length} hint="Added or updated a listing" icon={Users} />
        <StatCard label="Listings updated" value={new Set(listings.byEmployee.flatMap((e) => e.updated)).size} hint="Distinct businesses" icon={CheckCircle2} />
      </div>
      <Panel title="By employee" subtitle="Businesses added and updated in this period — expand a row to see them">
        {listings.byEmployee.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No listing activity in this period.</p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {listings.byEmployee.map((e) => (
              <li key={e.employeeId} className="py-2.5">
                <details>
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                    <AdminMemberLink userId={e.employeeId} name={nameOf(e.employeeId)} />
                    <span className="tabular-nums text-muted-foreground"><strong className="text-foreground">{e.added.length}</strong> added</span>
                    <span className="tabular-nums text-muted-foreground"><strong className="text-foreground">{e.updated.length}</strong> updated</span>
                  </summary>
                  <div className="mt-2 grid gap-3 pl-4 text-sm sm:grid-cols-2">
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Added</p><ul className="mt-1 space-y-0.5">{e.added.length ? e.added.map((id) => <li key={id}><AdminBusinessLink businessId={id} className="font-medium" /></li>) : <li className="text-muted-foreground">—</li>}</ul></div>
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Updated</p><ul className="mt-1 space-y-0.5">{e.updated.length ? e.updated.map((id) => <li key={id}><AdminBusinessLink businessId={id} className="font-medium" /></li>) : <li className="text-muted-foreground">—</li>}</ul></div>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <h2 className="pt-2 text-xl font-semibold text-olive-950">Appointment &amp; meeting analytics</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Appointments requested" value={metrics.requested.length} hint="Requested in this period" icon={CalendarClock} href={qs({})} />
        <StatCard label="Upcoming" value={metrics.upcoming.length} hint="Requested or confirmed, from today" icon={CalendarCheck} href="/admin/appointments?when=upcoming" />
        <StatCard label="Completed" value={metrics.completed.length} hint="Held in this period" icon={CheckCircle2} href={qs({ status: "completed" })} />
        <StatCard label="Cancelled" value={metrics.cancelled.length} hint="Scheduled in this period" icon={CalendarX} href={qs({ status: "cancelled" })} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="By day" subtitle={metrics.series.some((s) => s.label.length === 7) ? "Appointments per month" : "Appointments per day"} className="lg:col-span-1">
          {metrics.series.length ? <BarChart data={metrics.series.map((s) => ({ label: s.label.length === 7 ? s.label : s.label.slice(5), value: s.value }))} label="Appointments over time" /> : <p className="py-4 text-sm text-muted-foreground">No appointments in this period.</p>}
        </Panel>
        <Panel title="By service type">
          {metrics.byType.length ? <HBarList items={metrics.byType} /> : <p className="py-4 text-sm text-muted-foreground">—</p>}
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">{metrics.byType.map((t) => <li key={t.label}><Link className="font-semibold text-olive-700 hover:underline" href={qs({ topic: t.label })}>{t.label}</Link></li>)}</ul>
        </Panel>
        <Panel title="Assigned to each employee">
          {metrics.byEmployee.length ? (
            <ul className="divide-y divide-sand-200 text-sm">
              {metrics.byEmployee.map((e) => (
                <li key={e.employeeId ?? "none"} className="flex items-center justify-between py-2">
                  {e.employeeId ? <AdminMemberLink userId={e.employeeId} name={nameOf(e.employeeId)} /> : <span className="text-muted-foreground">Unassigned</span>}
                  <Link href={qs({ assigned: e.employeeId ?? "none" })} className="font-semibold tabular-nums text-olive-700 hover:underline">{e.value}</Link>
                </li>
              ))}
            </ul>
          ) : <p className="py-4 text-sm text-muted-foreground">—</p>}
        </Panel>
      </div>
    </div>
  );
}
