"use client";

import { Download, Eye, MousePointerClick, Navigation, Phone, Bookmark } from "lucide-react";
import { AreaChart, HBarList } from "@/components/admin/charts";
import { Panel, StatCard } from "@/components/dashboard/panel";
import { UpgradePrompt } from "@/components/membership/feature-access";
import { Button } from "@/components/ui/button";
import { useBusinessAnalytics } from "@/features/business/hooks";
import { cheapestPlanWith, hasFeature } from "@/features/membership/access";
import { useAllPlans, useResolvedPlan } from "@/features/membership/hooks";
import { toCSV } from "@/lib/csv";
import type { Business } from "@/types";

const pct = (now: number, prev: number) => (prev === 0 ? 0 : Math.round(((now - prev) / prev) * 1000) / 10);

/** Analytics for one business. What's shown depends on the plan's analytics features; locked sections explain which plan unlocks them. */
export function AnalyticsView({ business }: { business: Business }) {
  const plan = useResolvedPlan("business", business.id);
  const plans = useAllPlans();
  const data = useBusinessAnalytics(business.id, 30);

  if (!data) return null;
  const basic = hasFeature(plan, "analytics_basic");
  const trends = hasFeature(plan, "analytics_trends");
  const insights = hasFeature(plan, "analytics_insights");
  const exportable = hasFeature(plan, "analytics_export");
  const need = (id: string) => cheapestPlanWith(plans, "business", id)?.name;

  function exportCsv() {
    const csv = toCSV([["date", "views", "website clicks"], ...data!.series.map((d) => [d.label, d.views, d.clicks])]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business.slug}-analytics.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!basic) {
    return <UpgradePrompt featureLabel="Analytics" requiredPlan={need("analytics_basic")} href="/dashboard/memberships" />;
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">Last 30 days · {plan?.name} plan · Sample data for this preview — real analytics arrive with the backend.</p>

      <section aria-label="Key numbers" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Profile views" value={data.totals.views.toLocaleString()} delta={trends ? pct(data.totals.views, data.previous.views) : undefined} icon={Eye} />
        <StatCard label="Website clicks" value={data.totals.websiteClicks.toLocaleString()} delta={trends ? pct(data.totals.websiteClicks, data.previous.websiteClicks) : undefined} icon={MousePointerClick} />
        <StatCard label="Calls" value={data.totals.calls.toLocaleString()} icon={Phone} />
        <StatCard label="Directions" value={data.totals.directions.toLocaleString()} icon={Navigation} />
        <StatCard label="Saves" value={data.totals.saves.toLocaleString()} icon={Bookmark} />
      </section>

      {trends ? (
        <Panel title="Profile views per day" subtitle="Hover the dots for exact values">
          <AreaChart data={data.series.filter((_, i) => i % 3 === 0 || i === data.series.length - 1).map((d) => ({ label: d.label, value: d.views }))} label="Profile views per day" />
        </Panel>
      ) : (
        <UpgradePrompt featureLabel="Daily trends and period comparison" requiredPlan={need("analytics_trends")} href="/dashboard/memberships" />
      )}

      {insights ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Where visitors come from"><HBarList items={data.sources} /></Panel>
          <Panel title="Top searches that found you"><HBarList items={data.searchTerms} /></Panel>
        </div>
      ) : (
        <UpgradePrompt featureLabel="Traffic sources and search terms" requiredPlan={need("analytics_insights")} href="/dashboard/memberships" />
      )}

      <div>
        {exportable ? (
          <Button variant="outline" onClick={exportCsv}><Download /> Export CSV</Button>
        ) : (
          <UpgradePrompt featureLabel="CSV export" requiredPlan={need("analytics_export")} href="/dashboard/memberships" />
        )}
      </div>
    </div>
  );
}
