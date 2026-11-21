"use client";

import { useMemo } from "react";
import { CalendarDays, Tag } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { DemoNotice } from "@/components/shared/demo-notice";
import { StatusPill } from "@/components/dashboard/status-pill";
import { describePromotion } from "@/features/services/pricing";
import { useStore } from "@/hooks/use-store";
import { formatDate, todayISO } from "@/lib/date";
import { promotionStore } from "@/services/marketplace-service";

/** Public promotional content. All offers are demo-only; no billing or discount redemption happens here. */
export function PromotionsClient() {
  const promotions = useStore(promotionStore);
  const live = useMemo(() => promotions.filter((p) => p.active && p.approval === "approved" && p.startsOn <= todayISO() && (!p.endsOn || p.endsOn >= todayISO())), [promotions]);
  return (
    <>
      <section className="border-b border-sand-200 bg-sand-100"><div className="container-page py-10 sm:py-14"><p className="eyebrow">Promotions</p><h1 className="mt-2 text-4xl font-semibold text-olive-950 sm:text-5xl">Member promotions</h1><p className="mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">Current demo promotions managed by administrators. Coupons and discounts are examples only and are not processed in this preview.</p><div className="mt-5"><DemoNotice /></div></div></section>
      <div className="container-page py-8 sm:py-12">
        {live.length === 0 ? <EmptyState icon={Tag} title="No active promotions" description="New promotions will appear here when an administrator activates them." /> : <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{live.map((p) => <li key={p.id}><article className="flex h-full flex-col rounded-lg border bg-card p-5 shadow-card"><div className="flex items-center justify-between gap-2"><StatusPill tone="good"><Tag className="size-3" /> {describePromotion(p)}</StatusPill>{p.couponCode && <code className="rounded bg-sand-100 px-2 py-1 text-xs font-semibold">{p.couponCode}</code>}</div><h2 className="mt-4 text-lg font-semibold text-olive-950">{p.name}</h2><div className="mt-auto flex items-center gap-1.5 pt-5 text-xs text-muted-foreground"><CalendarDays className="size-3.5" /> Starts {formatDate(p.startsOn)}{p.endsOn ? ` · ends ${formatDate(p.endsOn)}` : " · ongoing"}</div></article></li>)}</ul>}
      </div>
    </>
  );
}
