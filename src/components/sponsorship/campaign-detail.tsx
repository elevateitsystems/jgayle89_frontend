"use client";

import { CheckCircle2, CircleDot, CalendarCheck, MessageSquareWarning, XCircle } from "lucide-react";
import { CampaignPreview } from "./campaign-preview";
import { CampaignStatusPill } from "@/components/dashboard/status-pill";
import { displayStatus, isPaid } from "@/features/advertising/rules";
import { formatPrice } from "@/features/membership/access";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { useEvents } from "@/hooks/use-events";
import { US_STATES } from "@/data/us-states";
import { formatDate, todayISO } from "@/lib/date";
import { resourceService } from "@/services/resource-service";
import type { AdCampaign, AdProduct, CampaignEvent } from "@/types";

const EVENT_ICON = { submitted: CircleDot, resubmitted: CircleDot, approved: CheckCircle2, rejected: XCircle, changes_requested: MessageSquareWarning, scheduled: CalendarCheck } as const;
const EVENT_LABEL: Record<CampaignEvent["action"], string> = { submitted: "Submitted", resubmitted: "Resubmitted", approved: "Approved", rejected: "Rejected", changes_requested: "Changes requested", scheduled: "Scheduled" };
const PAYMENT_LABEL = { unpaid: "Unpaid", paid: "Paid", credit: "Paid with credit", refunded: "Refunded" } as const;

/** Full campaign view: preview, targeting, schedule, billing, performance and history. Shared by advertisers and reviewers. */
export function CampaignDetail({ campaign: c, product }: { campaign: AdCampaign; product: AdProduct }) {
  const { businesses } = useBusinesses();
  const { categoryName } = useCategories();
  const { events } = useEvents();
  const business = businesses.find((b) => b.id === c.businessId);
  const status = displayStatus(c, todayISO());
  const t = c.targeting;
  const targeting = [
    t.categoryIds.length ? `Categories: ${t.categoryIds.map(categoryName).join(", ")}` : "",
    t.states.length ? `States: ${t.states.map((s) => US_STATES.find((x) => x.code === s)?.name ?? s).join(", ")}` : "",
    t.city ? `City: ${t.city}` : "",
    t.eventId ? `Event: ${events.find((e) => e.id === t.eventId)?.title ?? t.eventId}` : "",
    t.resourceId ? `Resource: ${resourceService.byId(t.resourceId)?.title ?? t.resourceId}` : "",
  ].filter(Boolean);
  const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">{product.name} · {c.businessName}</p>
        <CampaignStatusPill status={status} />
      </div>

      <CampaignPreview product={product} business={business} creative={c.creative} />

      <dl className="grid gap-4 rounded-lg border bg-white p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Schedule</dt><dd className="mt-0.5">{c.startDate && c.endDate ? `${formatDate(c.startDate)} – ${formatDate(c.endDate)}` : `Requested start ${formatDate(c.requestedStart)} · ${c.durationDays} days`}</dd></div>
        <div><dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Billing</dt><dd className="mt-0.5">{formatPrice(c.price)}{c.creditApplied > 0 ? ` (−${formatPrice(c.creditApplied)} credit)` : ""} · {PAYMENT_LABEL[c.paymentStatus]}{!isPaid(c) && c.status !== "rejected" ? " — via Stripe Checkout" : ""}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Targeting</dt><dd className="mt-0.5">{targeting.length ? targeting.join(" · ") : "No targeting — shown to everyone"}</dd></div>
        <div className="sm:col-span-2"><dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Performance</dt><dd className="mt-0.5 tabular-nums">{c.impressions.toLocaleString()} impressions · {c.clicks.toLocaleString()} clicks · {ctr}{ctr === "—" ? "" : "%"} CTR</dd></div>
      </dl>

      {c.reviewNote && (
        <p className="rounded-md border border-brass/40 bg-brass-soft p-3 text-sm text-sand-700"><strong>Note from {c.reviewerName ?? "staff"}:</strong> {c.reviewNote}</p>
      )}

      <section aria-labelledby="cd-history">
        <h3 id="cd-history" className="mb-2 font-sans text-sm font-semibold text-olive-950">History</h3>
        <ol className="space-y-3 border-l-2 border-sand-200 pl-4">
          {c.history.map((h, i) => {
            const Icon = EVENT_ICON[h.action];
            return (
              <li key={i} className="relative">
                <span className="absolute -left-[25px] flex size-4 items-center justify-center rounded-full bg-sand-50"><Icon className="size-4 text-olive-600" aria-hidden /></span>
                <p className="text-sm font-medium text-olive-950">{EVENT_LABEL[h.action]} <span className="font-normal text-muted-foreground">· {h.by} · {formatDate(h.at)}</span></p>
                {h.note && <p className="text-sm text-muted-foreground">{h.note}</p>}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
