"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  FileUp,
  Eye,
  Images,
  Plus,
  Store,
  UserPlus,
  Star,
  type LucideIcon,
} from "lucide-react";
import { AreaChart, BarChart, HBarList } from "./charts";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { DateBadge } from "@/components/events/event-card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardStats, listingsGrowth, recentActivity, visitorsTrend } from "@/data/dashboard";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { useEvents } from "@/hooks/use-events";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { useClientNow } from "@/hooks/use-store";
import { isUpcoming, timeAgo } from "@/lib/date";
import { ROLE_LABEL, hasPermission, isAdmin } from "@/lib/permissions";
import { userStore } from "@/services/user-service";
import { cn } from "@/lib/utils";

const activityIcon: Record<string, LucideIcon> = {
  business: Store,
  event: CalendarDays,
  import: FileUp,
  user: UserPlus,
  review: Star,
};

export function DashboardClient() {
  const { businesses, loading } = useBusinesses();
  const { events } = useEvents();
  const { categoryById } = useCategories();
  const user = useSession();
  const users = useStore(userStore);
  const canBusinesses = hasPermission(user, "businesses.manage");
  const canPhotos = hasPermission(user, "photos.upload");
  const canImport = hasPermission(user, "csv.import");
  const canEvents = hasPermission(user, "events.manage");
  const team = useMemo(
    () => ({
      staff: users.filter((u) => u.role === "staff").length,
      members: users.filter((u) => u.role === "user").length,
      veterans: users.filter((u) => u.role === "user" && u.userType === "veteran").length,
      civilians: users.filter((u) => u.role === "user" && u.userType === "civilian").length,
    }),
    [users],
  );

  const upcoming = useMemo(
    () => events.filter((e) => e.status === "published" && isUpcoming(e.date)).sort((a, b) => a.date.localeCompare(b.date)),
    [events],
  );
  const recent = useMemo(() => [...businesses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [businesses]);
  // Timestamps depend on the clock, so compute them after mount to keep SSR/hydration identical.
  const now = useClientNow();
  const activity = useMemo(() => (now ? recentActivity(now) : []), [now]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    businesses.forEach((b) => m.set(b.category, (m.get(b.category) ?? 0) + 1));
    return [...m.entries()]
      .map(([id, value]) => ({ label: categoryById(id)?.name ?? id, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [businesses, categoryById]);

  const stats = dashboardStats.map((s) =>
    s.id === "listings" ? { ...s, value: businesses.length, hint: `${businesses.filter((b) => b.status === "active").length} active` }
    : s.id === "events" ? { ...s, value: upcoming.length }
    : s,
  );

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Signed in as ${user ? ROLE_LABEL[user.role] : ""}. A snapshot of listings, events and community activity — figures marked demo are sample data.`}
        actions={
          <>
            {canImport && (
              <Link href="/admin/import" className={buttonVariants({ variant: "outline" })}>
                <FileUp /> Import CSV
              </Link>
            )}
            {canPhotos && (
              <Link href="/admin/photos" className={buttonVariants({ variant: "outline" })}>
                <Images /> Upload photos
              </Link>
            )}
            {canEvents && (
              <Link href="/admin/events" className={buttonVariants({ variant: canBusinesses ? "outline" : "default" })}>
                <CalendarDays /> Manage events
              </Link>
            )}
            {canBusinesses && (
              <Link href="/admin/businesses/new" className={buttonVariants()}>
                <Plus /> Add business
              </Link>
            )}
          </>
        }
      />

      <section aria-label="Key statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.id} className="rounded-lg border bg-card p-5 shadow-card">
            <p className="text-sm font-medium text-muted-foreground">{s.label}</p>
            <div className="mt-2 flex items-end justify-between gap-2">
              {loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <p className="font-heading text-4xl font-semibold tabular-nums text-olive-950">{s.value.toLocaleString()}</p>
              )}
              <span
                className={cn(
                  "mb-1 inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                  s.delta >= 0 ? "bg-olive-100 text-olive-800" : "bg-destructive/10 text-destructive",
                )}
              >
                {s.delta >= 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {Math.abs(s.delta)}%
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <Panel title="New listings per month" subtitle="Demo data" className="lg:col-span-1">
          <BarChart data={listingsGrowth} label="New listings per month" />
        </Panel>
        <Panel title="Visitors, last 4 weeks" subtitle="Demo analytics" className="lg:col-span-1">
          <AreaChart data={visitorsTrend} label="Weekly visitors" />
        </Panel>
        <Panel title="Listings by category" subtitle="Live from your data" className="lg:col-span-1">
          <HBarList items={byCategory} />
        </Panel>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        {(canBusinesses || canPhotos) && (
        <Panel
          title="Recent business listings"
          className="xl:col-span-2"
          action={
            <Link href={canBusinesses ? "/admin/businesses" : "/admin/photos"} className="text-sm font-semibold text-olive-700 hover:underline">
              {canBusinesses ? "View all" : "Manage photos"}
            </Link>
          }
        >
          <ul className="-mx-2 divide-y divide-sand-200">
            {recent.map((b) => (
              <li key={b.id} className="flex items-center gap-3 px-2 py-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-sand-200">
                  <Image src={b.coverImage} alt="" fill sizes="48px" className="object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-olive-950">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {categoryById(b.category)?.name} · {b.city}, {b.state}
                  </p>
                </div>
                <StatusBadge status={b.status} />
                {canBusinesses && (
                  <Link href={`/admin/businesses/${b.id}/edit`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "hidden sm:inline-flex")}>
                    Edit
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Panel>
        )}

        {canEvents && (
        <Panel
          title="Upcoming events"
          action={<Link href="/admin/events" className="text-sm font-semibold text-olive-700 hover:underline">Manage</Link>}
        >
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No upcoming published events.</p>
          ) : (
            <ul className="space-y-4">
              {upcoming.slice(0, 4).map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <DateBadge date={e.date} className="shrink-0 ring-sand-300" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-olive-950">{e.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.city}, {e.state} · {e.registered} registered</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        )}
      </section>

      {isAdmin(user) && (
        <section className="mt-6" aria-label="Community and team">
          <Panel
            title="Community & team"
            subtitle="Live from your data"
            action={<Link href="/admin/users" className="text-sm font-semibold text-olive-700 hover:underline">Manage users</Link>}
          >
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ["Registered users", team.members],
                ["Veteran / Military", team.veterans],
                ["Civilian", team.civilians],
                ["Staff", team.staff],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-heading text-3xl font-semibold tabular-nums text-olive-950">{value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        </section>
      )}

      <section className="mt-6">
        <Panel title="Recent activity" subtitle="Sample activity feed">
          <ul className="divide-y divide-sand-200">
            {activity.length === 0 && Array.from({ length: 4 }).map((_, i) => <li key={i} className="py-3"><Skeleton className="h-8 w-full" /></li>)}
            {activity.map((a) => {
              const Icon = activityIcon[a.type] ?? Eye;
              return (
                <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-olive-100 text-olive-700">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">{a.message}</p>
                    <p className="text-xs text-muted-foreground">{a.actor}</p>
                  </div>
                  <time className="shrink-0 text-xs text-muted-foreground" dateTime={a.time}>
                    {timeAgo(a.time, now ?? undefined)}
                  </time>
                </li>
              );
            })}
          </ul>
        </Panel>
      </section>
    </>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-lg border bg-card p-5 shadow-card", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-sans text-base font-semibold text-olive-950">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

