"use client";

import { useMemo, useState } from "react";
import { AdminBusinessLink } from "./entity-links";
import { PageHeader } from "./page-header";
import { AnalyticsView } from "@/components/business/analytics-view";
import { StatusPill } from "@/components/dashboard/status-pill";
import { NativeSelect } from "@/components/ui/native-select";
import { hasFeature } from "@/features/membership/access";
import { useBusinessPlans } from "@/features/membership/hooks";
import { useBusinesses } from "@/hooks/use-businesses";

/**
 * Admin → Business Analytics (client update §7A): administrators can open ANY business's analytics for research
 * and promotional purposes, whatever its plan. Business owners only see analytics on Business Pro and Executive.
 */
export function BusinessAnalyticsAdmin() {
  const { businesses } = useBusinesses();
  const sorted = useMemo(() => [...businesses].sort((a, b) => a.name.localeCompare(b.name)), [businesses]);
  const plans = useBusinessPlans(sorted.map((b) => b.id));
  const [id, setId] = useState("");
  const selected = sorted.find((b) => b.id === id) ?? sorted[0];
  const plan = selected ? plans.get(selected.id) : undefined;
  const ownerSees = hasFeature(plan, "analytics_basic");

  return (
    <>
      <PageHeader title="Business analytics" description="Every business's analytics, regardless of plan. Owners themselves only get analytics on Business Pro and Business Executive." />
      <div className="mb-6 flex flex-wrap items-end gap-4">
        <label className="block max-w-md flex-1 text-sm font-medium text-olive-950">
          Business
          <NativeSelect className="mt-1.5" value={selected?.id ?? ""} onChange={(e) => setId(e.target.value)}>
            {sorted.map((b) => <option key={b.id} value={b.id}>{b.name} — {plans.get(b.id)?.name ?? "Free"}</option>)}
          </NativeSelect>
        </label>
        {selected && (
          <p className="flex flex-wrap items-center gap-2 pb-2 text-sm">
            <AdminBusinessLink businessId={selected.id} />
            <StatusPill tone={ownerSees ? "good" : "neutral"}>{ownerSees ? `Owner can see analytics (${plan?.name})` : `Hidden from owner (${plan?.name ?? "Free"} plan)`}</StatusPill>
          </p>
        )}
      </div>
      {selected && <AnalyticsView key={selected.id} business={selected} fullAccess />}
    </>
  );
}
