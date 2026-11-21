"use client";

import Link from "next/link";
import { ArrowRight, Tag } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { buttonVariants } from "@/components/ui/button";
import { StatusPill } from "@/components/dashboard/status-pill";
import { describePromotion } from "@/features/services/pricing";
import { useStore } from "@/hooks/use-store";
import { todayISO } from "@/lib/date";
import { promotionStore } from "@/services/marketplace-service";
import { cn } from "@/lib/utils";

export function PromotionsSection() {
  const promotions = useStore(promotionStore).filter((p) => p.active && p.approval === "approved" && p.startsOn <= todayISO() && (!p.endsOn || p.endsOn >= todayISO())).slice(0, 3);
  if (promotions.length === 0) return null;
  return <section className="section-y border-y border-sand-200 bg-sand-100"><div className="container-page"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><SectionHeading eyebrow="Member savings" title="Current promotions" description="Sample promotions managed by the Mission: SITREP team." /><Link href="/promotions" className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>View all promotions <ArrowRight /></Link></div><ul className="mt-7 grid gap-4 sm:grid-cols-3">{promotions.map((p) => <li key={p.id} className="rounded-lg border bg-card p-4 shadow-card"><StatusPill tone="good"><Tag className="size-3" /> {describePromotion(p)}</StatusPill><p className="mt-3 font-semibold text-olive-950">{p.name}</p></li>)}</ul></div></section>;
}
