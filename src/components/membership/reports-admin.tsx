"use client";

import { useMemo } from "react";
import { BadgeCheck, CircleDollarSign, Megaphone, ShieldCheck } from "lucide-react";
import { BarChart, HBarList } from "@/components/admin/charts";
import { PageHeader } from "@/components/admin/page-header";
import { Panel, StatCard } from "@/components/dashboard/panel";
import { useCampaigns } from "@/features/advertising/hooks";
import { displayStatus, STATUS_LABEL } from "@/features/advertising/rules";
import { useBadgeAssignments, useBadgeRequests, useBadges } from "@/features/badges/hooks";
import { useEditRequests } from "@/features/business/hooks";
import { formatPrice } from "@/features/membership/access";
import { useAllPlans, useInvoices, useSubscriptions } from "@/features/membership/hooks";
import { useStore } from "@/hooks/use-store";
import { todayISO } from "@/lib/date";
import { AUDIENCE_LABEL } from "@/lib/mock-data/membership";
import { userStore } from "@/services/user-service";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Admin → Reports & Analytics, computed live from the same stores the rest of the app uses. */
export function ReportsAdmin() {
  const invoices = useInvoices();
  const subs = useSubscriptions();
  const plans = useAllPlans();
  const campaigns = useCampaigns();
  const edits = useEditRequests();
  const badges = useBadges();
  const assignments = useBadgeAssignments();
  const badgeRequests = useBadgeRequests();
  const users = useStore(userStore);
  const today = todayISO();

  const revenueByMonth = useMemo(() => {
    const now = new Date(`${today}T00:00:00Z`);
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1));
      const key = d.toISOString().slice(0, 7);
      return { label: MONTHS[d.getUTCMonth()], value: Math.round(invoices.filter((x) => x.status === "paid" && x.date.startsWith(key)).reduce((n, x) => n + x.amount, 0)) };
    });
  }, [invoices, today]);

  const paid = invoices.filter((i) => i.status === "paid");
  const total = paid.reduce((n, i) => n + i.amount, 0);
  const advertising = paid.filter((i) => i.kind === "advertising").reduce((n, i) => n + i.amount, 0);
  const paidSubs = subs.filter((s) => (s.status === "active" || s.status === "past_due") && (plans.find((p) => p.id === s.planId)?.monthlyPrice ?? 0) > 0);

  const bySubscribers = useMemo(
    () => plans.map((p) => ({ label: `${AUDIENCE_LABEL[p.audience]} · ${p.name}`, value: subs.filter((s) => s.planId === p.id && (s.status === "active" || s.status === "past_due")).length })).filter((x) => x.value > 0).sort((a, b) => b.value - a.value),
    [plans, subs],
  );
  const byCampaignStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of campaigns) m.set(STATUS_LABEL[displayStatus(c, today)], (m.get(STATUS_LABEL[displayStatus(c, today)]) ?? 0) + 1);
    return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  }, [campaigns, today]);
  const byBadge = badges.map((b) => ({ label: b.name, value: assignments.filter((a) => a.badgeId === b.id && a.status === "active").length })).sort((a, b) => b.value - a.value);
  const byUserType = [
    { label: "Veteran / Military", value: users.filter((u) => u.role === "user" && u.userType === "veteran").length },
    { label: "Civilian", value: users.filter((u) => u.role === "user" && u.userType === "civilian").length },
    { label: "Business owners", value: users.filter((u) => u.role === "user" && u.userType === "business_owner").length },
    { label: "Staff & admins", value: users.filter((u) => u.role !== "user").length },
  ];

  const reviewedEdits = edits.filter((e) => e.status !== "pending");
  const avgDays = reviewedEdits.length ? reviewedEdits.reduce((n, e) => n + Math.max(0, (Date.parse(e.updatedAt) - Date.parse(e.createdAt)) / 86_400_000), 0) / reviewedEdits.length : 0;

  return (
    <>
      <PageHeader title="Reports & analytics" description="Revenue, subscriptions, advertising and review activity. Sample data for this preview." />
      <section aria-label="Headline numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue (all time)" value={formatPrice(total)} hint={`${formatPrice(advertising)} from advertising`} icon={CircleDollarSign} />
        <StatCard label="Paid subscribers" value={paidSubs.length} hint="Active or past due" icon={BadgeCheck} />
        <StatCard label="Campaigns" value={campaigns.length} hint={`${campaigns.filter((c) => displayStatus(c, today) === "active").length} active now`} icon={Megaphone} />
        <StatCard label="Pending reviews" value={edits.filter((e) => e.status === "pending").length + badgeRequests.filter((r) => r.status === "pending").length + campaigns.filter((c) => c.status === "pending_review").length} hint="Edits, badges and campaigns" icon={ShieldCheck} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue by month" subtitle="Paid invoices, USD"><BarChart data={revenueByMonth} label="Revenue by month" /></Panel>
        <Panel title="Subscribers by plan"><HBarList items={bySubscribers} /></Panel>
        <Panel title="Campaigns by status"><HBarList items={byCampaignStatus} /></Panel>
        <Panel title="Badge holders"><HBarList items={byBadge} /></Panel>
        <Panel title="Accounts by type"><HBarList items={byUserType} /></Panel>
        <Panel title="Review turnaround">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">Edit requests reviewed</dt><dd className="mt-1 font-heading text-3xl font-semibold tabular-nums">{reviewedEdits.length}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Avg. time to decision</dt><dd className="mt-1 font-heading text-3xl font-semibold tabular-nums">{avgDays.toFixed(1)}<span className="ml-1 text-base text-muted-foreground">days</span></dd></div>
            <div><dt className="text-xs text-muted-foreground">Badge requests approved</dt><dd className="mt-1 font-heading text-3xl font-semibold tabular-nums">{badgeRequests.filter((r) => r.status === "approved").length}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Badge requests rejected</dt><dd className="mt-1 font-heading text-3xl font-semibold tabular-nums">{badgeRequests.filter((r) => r.status === "rejected").length}</dd></div>
          </dl>
        </Panel>
      </div>
    </>
  );
}
