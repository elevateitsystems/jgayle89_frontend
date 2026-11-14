"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Loader2, Phone, UsersRound, Video } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Panel } from "@/components/dashboard/panel";
import { StatusPill, type Tone } from "@/components/dashboard/status-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { UpgradePrompt, UsageMeter } from "@/components/membership/feature-access";
import { Button } from "@/components/ui/button";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cheapestPlanWith, limitOf } from "@/features/membership/access";
import { useAllPlans, useResolvedPlan } from "@/features/membership/hooks";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { daysFromToday, formatDate, formatTime } from "@/lib/date";
import { APPOINTMENT_TOPICS, appointmentSchema, type AppointmentFormValues } from "@/schemas/member";
import { appointmentService, appointmentStore, appointmentsInMonth } from "@/services/member-service";
import type { Appointment, AppointmentStatus } from "@/types";

const MODE_ICON = { phone: Phone, video: Video, in_person: UsersRound } as const;
const MODE_LABEL = { phone: "Phone call", video: "Video call", in_person: "In person" } as const;
const statusTone: Record<AppointmentStatus, Tone> = { requested: "warn", confirmed: "good", completed: "neutral", cancelled: "bad" };

export function AppointmentsClient() {
  const user = useSession();
  const plan = useResolvedPlan("veteran", user?.id);
  const plans = useAllPlans();
  const all = useStore(appointmentStore);
  const [toCancel, setToCancel] = useState<Appointment | null>(null);

  const mine = useMemo(() => all.filter((a) => a.userId === user?.id).sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`)), [all, user?.id]);
  const thisMonth = daysFromToday(0).slice(0, 7);
  const used = user ? appointmentsInMonth(all, user.id, thisMonth) : 0;
  const limit = limitOf(plan, "appointments");
  const upgrade = cheapestPlanWith(plans, "veteran", "appointments");

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({ resolver: zodResolver(appointmentSchema), defaultValues: { topic: "", mode: "video", date: "", time: "", notes: "" } });

  if (!user) return null;

  async function onSubmit(v: AppointmentFormValues) {
    try {
      await appointmentService.request(user!.id, v, limit);
      toast.success("Appointment requested", { description: "An advisor will confirm by email." });
      reset({ topic: "", mode: "video", date: "", time: "", notes: "" });
    } catch (e) {
      toast.error("Couldn't request the appointment", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const upcoming = mine.filter((a) => (a.status === "requested" || a.status === "confirmed") && a.date >= daysFromToday(0));
  const past = mine.filter((a) => !upcoming.includes(a));
  const full = limit !== null && used >= limit;

  return (
    <>
      <PageHeader title="Appointments" description="Book time with a Mission: SITREP advisor for benefits, career or financial questions." />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Panel title="Your appointments" subtitle="Upcoming first, then history">
            {mine.length === 0 ? (
              <EmptyState icon={CalendarClock} title="No appointments yet" description="Request one using the form and an advisor will confirm a time." />
            ) : (
              <>
                <AppointmentList title="Upcoming" items={upcoming} onCancel={setToCancel} />
                <AppointmentList title="Past & cancelled" items={past} />
              </>
            )}
          </Panel>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Panel title="This month's allowance">
            <UsageMeter plan={plan} featureId="appointments" used={used} label="Appointments" />
            {full && upgrade && <p className="mt-3 text-xs text-muted-foreground">You&apos;ve used every appointment this month. {upgrade.name} and above include more.</p>}
          </Panel>

          {limit === 0 ? (
            <UpgradePrompt featureLabel="Advisor appointments" requiredPlan={upgrade?.name} href="/dashboard/membership" />
          ) : (
            <Panel title="Request an appointment">
              <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
                <FormField label="Topic" htmlFor="ap-topic" error={errors.topic?.message} required>
                  <NativeSelect id="ap-topic" aria-invalid={!!errors.topic} aria-describedby={describedBy("ap-topic", errors.topic?.message)} {...register("topic")}>
                    <option value="">Select…</option>
                    {APPOINTMENT_TOPICS.map((t) => <option key={t}>{t}</option>)}
                  </NativeSelect>
                </FormField>
                <FormField label="How would you like to meet?" htmlFor="ap-mode" error={errors.mode?.message} required>
                  <NativeSelect id="ap-mode" {...register("mode")}>
                    <option value="video">Video call</option>
                    <option value="phone">Phone call</option>
                    <option value="in_person">In person</option>
                  </NativeSelect>
                </FormField>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Date" htmlFor="ap-date" error={errors.date?.message} required>
                    <Input id="ap-date" type="date" min={daysFromToday(1)} aria-invalid={!!errors.date} aria-describedby={describedBy("ap-date", errors.date?.message)} {...register("date")} />
                  </FormField>
                  <FormField label="Time" htmlFor="ap-time" error={errors.time?.message} required>
                    <Input id="ap-time" type="time" aria-invalid={!!errors.time} aria-describedby={describedBy("ap-time", errors.time?.message)} {...register("time")} />
                  </FormField>
                </div>
                <FormField label="Notes for your advisor" htmlFor="ap-notes" error={errors.notes?.message} hint="Optional. Don't include sensitive personal information.">
                  <Textarea id="ap-notes" rows={3} {...register("notes")} />
                </FormField>
                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <><Loader2 className="animate-spin" /> Requesting…</> : "Request appointment"}
                </Button>
              </form>
            </Panel>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!toCancel}
        onOpenChange={(o) => !o && setToCancel(null)}
        destructive
        title="Cancel this appointment?"
        description={toCancel ? `${toCancel.topic} on ${formatDate(toCancel.date)} at ${formatTime(toCancel.time)} will be cancelled and won't count against your allowance.` : ""}
        confirmLabel="Cancel appointment"
        busyLabel="Cancelling…"
        successMessage="Appointment cancelled"
        onConfirm={async () => {
          if (toCancel) await appointmentService.cancel(toCancel.id, user.id);
        }}
      />
    </>
  );
}

function AppointmentList({ title, items, onCancel }: { title: string; items: Appointment[]; onCancel?: (a: Appointment) => void }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-5 last:mb-0">
      <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-[0.14em] text-olive-700">{title}</h3>
      <ul className="divide-y divide-sand-200 rounded-md border">
        {items.map((a) => {
          const Icon = MODE_ICON[a.mode];
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-olive-100 text-olive-700"><Icon className="size-4" aria-hidden /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-olive-950">{a.topic}</p>
                <p className="text-sm text-muted-foreground">{formatDate(a.date)} · {formatTime(a.time)} · {MODE_LABEL[a.mode]}</p>
              </div>
              <StatusPill tone={statusTone[a.status]} className="capitalize">{a.status}</StatusPill>
              {onCancel && (a.status === "requested" || a.status === "confirmed") && (
                <Button variant="ghost" size="sm" onClick={() => onCancel(a)}>Cancel</Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
