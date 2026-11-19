"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { toast } from "sonner";
import { AdminMemberLink } from "./entity-links";
import { PageHeader } from "./page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill, type Tone } from "@/components/dashboard/status-pill";
import { NativeSelect } from "@/components/ui/native-select";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { formatDate, formatTime, todayISO } from "@/lib/date";
import { inRange } from "@/features/analytics/rules";
import { isBackOffice } from "@/lib/permissions";
import { appointmentAdminService, appointmentStore } from "@/services/member-service";
import { userStore } from "@/services/user-service";
import type { Appointment, AppointmentStatus } from "@/types";

const STATUS: Record<AppointmentStatus, { label: string; tone: Tone }> = {
  requested: { label: "Requested", tone: "warn" },
  confirmed: { label: "Confirmed", tone: "info" },
  completed: { label: "Completed", tone: "good" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};
const MODE = { phone: "Phone", video: "Video", in_person: "In person" } as const;

/**
 * Admin / Staff → Appointments: the requests members make from Appointments and the "Schedule an Appointment for
 * Assistance" buttons. Staff assign an employee and move them through Requested → Confirmed → Completed.
 * Accepts `?status=&topic=&assigned=&from=&to=&when=upcoming` so analytics reports can link straight here.
 */
export function AppointmentsAdmin() {
  const user = useSession();
  const params = useSearchParams();
  const appts = useStore(appointmentStore);
  const users = useStore(userStore);
  const staff = useMemo(() => users.filter((u) => isBackOffice(u) && u.status === "active"), [users]);
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [topic, setTopic] = useState(params.get("topic") ?? "");
  const [assigned, setAssigned] = useState(params.get("assigned") ?? "");
  const [when, setWhen] = useState(params.get("when") ?? "");
  const fromParam = params.get("from");
  const toParam = params.get("to");
  const range = useMemo(() => (fromParam && toParam ? { from: fromParam, to: toParam } : null), [fromParam, toParam]);
  const today = todayISO();

  const topics = useMemo(() => [...new Set(appts.map((a) => a.topic))].sort(), [appts]);
  const rows = useMemo(
    () =>
      appts.filter((a) => {
        if (status && a.status !== status) return false;
        if (topic && a.topic !== topic) return false;
        if (assigned === "none" ? !!a.assignedTo : assigned && a.assignedTo !== assigned) return false;
        if (when === "upcoming" && !((a.status === "requested" || a.status === "confirmed") && a.date >= today)) return false;
        if (range && !inRange(a.date, range)) return false;
        return true;
      }),
    [appts, status, topic, assigned, when, range, today],
  );

  async function update(a: Appointment, fn: () => Promise<void>, ok: string) {
    void a;
    try { await fn(); toast.success(ok); } catch (e) { toast.error("Couldn't update", { description: e instanceof Error ? e.message : undefined }); }
  }

  const columns: Column<Appointment>[] = [
    { id: "member", header: "Member", sort: (a) => users.find((u) => u.id === a.userId)?.name ?? "", cell: (a) => <AdminMemberLink userId={a.userId} /> },
    {
      id: "topic", header: "Service type", sort: (a) => a.topic,
      cell: (a) => <span className="block max-w-[16rem]"><span className="block text-sm font-medium">{a.topic}</span>{a.context && <span className="block truncate text-xs text-muted-foreground">About: {a.context.title}</span>}</span>,
    },
    { id: "when", header: "When", sort: (a) => `${a.date}${a.time}`, cell: (a) => <span className="whitespace-nowrap text-sm">{formatDate(a.date)} · {formatTime(a.time)}<span className="block text-xs text-muted-foreground">{MODE[a.mode]}</span></span> },
    {
      id: "status", header: "Status", sort: (a) => a.status,
      cell: (a) => user ? (
        <NativeSelect aria-label={`Status for ${a.topic} on ${a.date}`} value={a.status} onChange={(e) => update(a, () => appointmentAdminService.setStatus(a.id, e.target.value as AppointmentStatus, user), "Status updated")} className="h-8 w-36 text-xs">
          {(Object.keys(STATUS) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </NativeSelect>
      ) : <StatusPill tone={STATUS[a.status].tone}>{STATUS[a.status].label}</StatusPill>,
    },
    {
      id: "assigned", header: "Assigned to", hideBelow: "md", sort: (a) => a.assignedTo ?? "",
      cell: (a) => user && (
        <NativeSelect aria-label={`Assign ${a.topic} on ${a.date}`} value={a.assignedTo ?? ""} onChange={(e) => update(a, () => appointmentAdminService.assign(a.id, e.target.value || undefined, user), "Assignment updated")} className="h-8 w-40 text-xs">
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </NativeSelect>
      ),
    },
  ];

  const filtered = !!(status || topic || assigned || when || range);
  return (
    <>
      <PageHeader title="Appointments" description="Member appointment requests, including help with benefits, freebies and services. Assign an employee and update the status." />
      {range && <p className="mb-3 text-sm text-muted-foreground">Showing appointments from {formatDate(range.from)} to {formatDate(range.to)} (from the analytics report).</p>}
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(a) => a.id}
        label="Appointments"
        pageSize={12}
        defaultSort={{ id: "when", dir: "desc" }}
        search={{ placeholder: "Search by member or topic", text: (a) => `${users.find((u) => u.id === a.userId)?.name ?? ""} ${a.topic} ${a.context?.title ?? ""}` }}
        filters={
          <>
            <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-36"><option value="">Any status</option>{(Object.keys(STATUS) as AppointmentStatus[]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}</NativeSelect>
            <NativeSelect aria-label="Filter by service type" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-52"><option value="">Any service type</option>{topics.map((t) => <option key={t}>{t}</option>)}</NativeSelect>
            <NativeSelect aria-label="Filter by employee" value={assigned} onChange={(e) => setAssigned(e.target.value)} className="w-44"><option value="">Anyone</option><option value="none">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</NativeSelect>
            <NativeSelect aria-label="Upcoming only" value={when} onChange={(e) => setWhen(e.target.value)} className="w-36"><option value="">All dates</option><option value="upcoming">Upcoming</option></NativeSelect>
            {filtered && (
              <a href="/admin/appointments" className="inline-flex h-10 items-center gap-1 text-sm font-semibold text-olive-700 hover:underline"><X className="size-3.5" aria-hidden /> Clear</a>
            )}
          </>
        }
        noMatches={{ onClear: () => { setStatus(""); setTopic(""); setAssigned(""); setWhen(""); } }}
        empty={{ title: "No appointments", description: "Requests from members appear here." }}
      />
    </>
  );
}
