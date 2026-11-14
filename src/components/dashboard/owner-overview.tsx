"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertCircle, Award, FileEdit, Megaphone, Store } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { HiringChip } from "@/components/business/hiring-toggle";
import { ListingStatusPill } from "@/components/business/business-picker";
import { Panel, PanelLink, StatCard } from "@/components/dashboard/panel";
import { EditStatusPill, StatusPill } from "@/components/dashboard/status-pill";
import { buttonVariants } from "@/components/ui/button";
import { useCampaigns } from "@/features/advertising/hooks";
import { awaitingPayment, displayStatus } from "@/features/advertising/rules";
import { useBadgeAssignments } from "@/features/badges/hooks";
import { summarizeChanges } from "@/features/business/changes";
import { useOwnedBusinesses, useOwnerEditRequests } from "@/features/business/hooks";
import { useBusinessPlans, useSubscriptions } from "@/features/membership/hooks";
import { todayISO, formatDate } from "@/lib/date";
import type { AppUser } from "@/types";

export function OwnerOverview({ user }: { user: AppUser }) {
  const { businesses, loading } = useOwnedBusinesses(user.id);
  const requests = useOwnerEditRequests(user.id);
  const campaigns = useCampaigns();
  const assignments = useBadgeAssignments();
  const subs = useSubscriptions();
  const plans = useBusinessPlans(businesses.map((b) => b.id));

  const ids = useMemo(() => new Set(businesses.map((b) => b.id)), [businesses]);
  const mineCampaigns = useMemo(() => campaigns.filter((c) => c.ownerId === user.id), [campaigns, user.id]);
  const today = todayISO();
  const active = mineCampaigns.filter((c) => displayStatus(c, today) === "active");
  const badgeCount = assignments.filter((a) => a.status === "active" && ids.has(a.businessId)).length;
  const pending = requests.filter((r) => r.status === "pending").length;

  const attention = (() => {
    const items: { key: string; text: string; href: string }[] = [];
    for (const r of requests.filter((x) => x.status === "changes_requested")) items.push({ key: r.id, text: `Staff asked for changes to your request for ${r.businessName}.`, href: "/dashboard/edit-requests" });
    for (const s of subs.filter((x) => x.audience === "business" && ids.has(x.subjectId) && x.status === "past_due")) {
      items.push({ key: s.id, text: `Payment is past due for ${businesses.find((b) => b.id === s.subjectId)?.name}.`, href: "/dashboard/memberships" });
    }
    for (const c of mineCampaigns) {
      if (c.status === "changes_requested") items.push({ key: c.id, text: `Changes requested on campaign “${c.name}”.`, href: "/dashboard/advertising" });
      else if (awaitingPayment(c) && displayStatus(c, today) !== "expired") items.push({ key: c.id, text: `Campaign “${c.name}” is approved and awaiting payment.`, href: "/dashboard/advertising" });
    }
    return items;
  })();

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Manage your businesses, memberships and advertising. Public listing changes are reviewed by staff."
        actions={<Link href="/dashboard/businesses" className={buttonVariants()}>My businesses</Link>}
      />

      <section aria-label="At a glance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Businesses" value={businesses.length} hint={`${businesses.filter((b) => b.status === "active").length} published`} icon={Store} loading={loading} href="/dashboard/businesses" />
        <StatCard label="Pending edit requests" value={pending} hint="Awaiting staff review" icon={FileEdit} href="/dashboard/edit-requests" />
        <StatCard label="Active campaigns" value={active.length} hint={`${active.reduce((n, c) => n + c.impressions, 0).toLocaleString()} impressions to date`} icon={Megaphone} href="/dashboard/advertising" />
        <StatCard label="Badges earned" value={badgeCount} hint="Across all businesses" icon={Award} href="/dashboard/badges" />
      </section>

      {attention.length > 0 && (
        <section aria-label="Needs your attention" className="mt-6 rounded-lg border border-brass/40 bg-brass-soft p-4">
          <h2 className="flex items-center gap-2 font-sans text-sm font-semibold text-sand-700"><AlertCircle className="size-4" aria-hidden /> Needs your attention</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {attention.map((a) => (
              <li key={a.key}><Link href={a.href} className="text-sand-700 underline-offset-2 hover:underline">{a.text}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Panel title="Your businesses" action={<PanelLink href="/dashboard/businesses">Manage</PanelLink>} className="lg:col-span-3">
          <ul className="divide-y divide-sand-200">
            {businesses.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <Link href={`/dashboard/businesses/${b.id}`} className="block truncate font-semibold text-olive-950 hover:text-olive-700">{b.name}</Link>
                  <p className="text-xs text-muted-foreground">{b.city}, {b.state}</p>
                </div>
                <HiringChip hiring={b.hiring} />
                <StatusPill tone="info">{plans.get(b.id)?.name ?? "Free"}</StatusPill>
                <ListingStatusPill status={b.status} />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent edit requests" action={<PanelLink href="/dashboard/edit-requests">All requests</PanelLink>} className="lg:col-span-2">
          {requests.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {requests.slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0"><p className="truncate text-sm font-medium text-olive-950">{r.businessName}</p><p className="truncate text-xs text-muted-foreground">{summarizeChanges(r.changes)} · {formatDate(r.createdAt)}</p></div>
                  <EditStatusPill status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
