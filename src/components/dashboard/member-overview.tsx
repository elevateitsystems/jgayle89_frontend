"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, CalendarDays, CalendarClock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { Panel, PanelLink, StatCard } from "@/components/dashboard/panel";
import { FeatureAccessIndicator } from "@/components/membership/feature-access";
import { SubscriptionStatusBadge } from "@/components/membership/subscription-summary";
import { DateBadge } from "@/components/events/event-card";
import { buttonVariants } from "@/components/ui/button";
import { MEMBER_NAV } from "@/features/dashboard/nav";
import { limitOf, formatPrice, priceFor } from "@/features/membership/access";
import { useAllPlans, useResolvedPlan, useSubscriptionFor } from "@/features/membership/hooks";
import { usePublishedEvents } from "@/hooks/use-events";
import { useStore } from "@/hooks/use-store";
import { daysFromToday, formatDate, formatTime, isUpcoming } from "@/lib/date";
import { cn } from "@/lib/utils";
import { appointmentStore, appointmentsInMonth, savedStore } from "@/services/member-service";
import type { AppUser } from "@/types";

const FEATURES: { id: string; label: string; audiences: string[] }[] = [
  { id: "saved_businesses", label: "Larger saved list", audiences: ["veteran", "civilian"] },
  { id: "event_early_access", label: "Early event registration", audiences: ["veteran", "civilian"] },
  { id: "member_discounts", label: "Member-only discounts", audiences: ["veteran", "civilian"] },
  { id: "benefits_alerts", label: "Benefit change alerts", audiences: ["veteran"] },
  { id: "financial_advanced", label: "Advanced financial tools", audiences: ["veteran", "civilian"] },
  { id: "education_courses", label: "Financial education courses", audiences: ["civilian"] },
  { id: "volunteer_matching", label: "Volunteer matching", audiences: ["civilian"] },
  { id: "priority_support", label: "Priority support", audiences: ["veteran", "civilian"] },
];

export function MemberOverview({ user }: { user: AppUser }) {
  const audience = user.userType === "veteran" ? "veteran" : "civilian";
  const plan = useResolvedPlan(audience, user.id);
  const plans = useAllPlans();
  const sub = useSubscriptionFor(audience, user.id);
  const saved = useStore(savedStore);
  const appts = useStore(appointmentStore);
  const { events, loading } = usePublishedEvents();

  const upcoming = useMemo(() => events.filter((e) => isUpcoming(e.date)).slice(0, 3), [events]);
  const savedCount = saved.filter((s) => s.userId === user.id).length;
  const savedLimit = limitOf(plan, "saved_businesses");
  const apptLimit = limitOf(plan, "appointments");
  const apptUsed = appointmentsInMonth(appts, user.id, daysFromToday(0).slice(0, 7));
  const quickLinks = MEMBER_NAV[audience].filter((i) => i.href !== "/dashboard" && i.href !== "/dashboard/settings");

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description={audience === "veteran" ? "Your benefits, businesses and advisor appointments in one place." : "Support veteran-owned businesses and find resources for your community."}
        actions={<Link href="/directory" className={buttonVariants()}>Browse the directory</Link>}
      />

      <section aria-label="At a glance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Membership" value={plan?.name ?? "Free"} hint={sub?.renewsOn && sub.status !== "canceled" ? `Renews ${formatDate(sub.renewsOn)}` : "No renewal — free plan"} icon={ShieldCheck} href="/dashboard/membership" />
        <StatCard label="Saved businesses" value={savedLimit === null ? savedCount : `${savedCount} / ${savedLimit}`} hint="Bookmarked from the directory" icon={Bookmark} href="/dashboard/saved" />
        {audience === "veteran" ? (
          <StatCard label="Appointments this month" value={apptLimit === null ? apptUsed : `${apptUsed} / ${apptLimit}`} hint="Advisor sessions" icon={CalendarClock} href="/dashboard/appointments" />
        ) : (
          <StatCard label="Community resources" value="Free" hint="Always available — no plan needed" icon={ShieldCheck} href="/dashboard/community" />
        )}
        <StatCard label="Upcoming events" value={upcoming.length} hint="Next 3 shown below" icon={CalendarDays} loading={loading} href="/events" />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="Your plan" subtitle={plan ? `${plan.name} · ${plan.monthlyPrice === 0 ? "Free" : `${formatPrice(priceFor(plan, sub?.cycle ?? "monthly"))} / ${sub?.cycle === "annual" ? "yr" : "mo"}`}` : undefined} className="lg:col-span-1" action={<SubscriptionStatusBadge subscription={sub} />}>
          <ul className="space-y-3">
            {FEATURES.filter((f) => f.audiences.includes(audience)).map((f) => (
              <li key={f.id}><FeatureAccessIndicator plan={plan} plans={plans} audience={audience} featureId={f.id} label={f.label} /></li>
            ))}
          </ul>
          <Link href="/dashboard/membership" className={cn(buttonVariants({ variant: "outline" }), "mt-5 w-full")}>Manage membership <ArrowRight /></Link>
          <p className="mt-3 text-xs text-muted-foreground">Business search and essential community resources are always free.</p>
        </Panel>

        <Panel title="Upcoming events" action={<PanelLink href="/events">All events</PanelLink>} className="lg:col-span-2">
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No upcoming events right now.</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {upcoming.map((e) => (
                <li key={e.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <DateBadge date={e.date} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/events/${e.slug}`} className="block truncate font-semibold text-olive-950 hover:text-olive-700">{e.title}</Link>
                    <p className="truncate text-sm text-muted-foreground">{formatTime(e.startTime)} · {e.venue.startsWith("Online") ? "Online" : `${e.city}, ${e.state}`}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Jump to" className="mt-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex items-center gap-3 rounded-md border bg-white p-3 text-sm font-medium transition-colors hover:border-olive-300 hover:bg-olive-50">
                <span className="flex size-9 items-center justify-center rounded-md bg-olive-100 text-olive-700"><l.icon className="size-4" aria-hidden /></span>
                {l.label}
                <ArrowRight className="ml-auto size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
