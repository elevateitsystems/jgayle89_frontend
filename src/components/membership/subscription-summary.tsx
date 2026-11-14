"use client";

import { CalendarClock, CreditCard, RefreshCw } from "lucide-react";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { describeSubscription, formatPrice, priceFor } from "@/features/membership/access";
import { formatDate } from "@/lib/date";
import type { MembershipPlan, Subscription } from "@/types";

export function SubscriptionStatusBadge({ subscription }: { subscription: Subscription | undefined }) {
  const { label, tone } = describeSubscription(subscription);
  return <StatusPill tone={tone}>{label}</StatusPill>;
}

interface Props {
  plan: MembershipPlan | undefined;
  subscription: Subscription | undefined;
  scheduledPlan?: MembershipPlan;
  /** What this plan belongs to, e.g. a business name. */
  subjectLabel?: string;
  onCancel: () => void;
  onResume: () => void;
  onClearScheduled: () => void;
  busy?: boolean;
}

/** Current plan, status, renewal date and the cancel / resume / undo-downgrade controls. */
export function SubscriptionSummary({ plan, subscription: sub, scheduledPlan, subjectLabel, onCancel, onResume, onClearScheduled, busy }: Props) {
  const paid = !!plan && plan.monthlyPrice > 0;
  const ended = !sub || sub.status === "canceled" || sub.status === "expired";
  const price = plan && sub ? priceFor(plan, sub.cycle) : 0;

  return (
    <section aria-label="Subscription" className="rounded-lg border bg-card p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {subjectLabel && <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{subjectLabel}</p>}
          <h2 className="mt-0.5 text-2xl font-semibold text-olive-950">{plan?.name ?? "Free"} plan</h2>
        </div>
        <SubscriptionStatusBadge subscription={sub} />
      </div>

      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"><CreditCard className="size-3.5" aria-hidden /> Price</dt>
          <dd className="mt-1 font-medium">{!paid || ended ? "Free" : `${formatPrice(price)} / ${sub!.cycle === "annual" ? "year" : "month"}`}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"><CalendarClock className="size-3.5" aria-hidden /> {sub?.cancelAtPeriodEnd ? "Access ends" : "Next renewal"}</dt>
          <dd className="mt-1 font-medium">{paid && sub?.renewsOn && !ended ? formatDate(sub.renewsOn) : "—"}</dd>
        </div>
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground"><RefreshCw className="size-3.5" aria-hidden /> Billing</dt>
          <dd className="mt-1 font-medium capitalize">{paid && !ended ? sub!.cycle : "—"}</dd>
        </div>
      </dl>

      {sub?.status === "past_due" && (
        <p role="alert" className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          The last payment didn&apos;t go through. Your plan stays active for a short grace period — update your payment method in the billing portal to avoid losing access.
        </p>
      )}
      {sub?.cancelAtPeriodEnd && sub.renewsOn && (
        <p className="mt-4 rounded-md border border-brass/40 bg-brass-soft px-3 py-2.5 text-sm text-sand-700">
          Your subscription is set to cancel. You keep {plan?.name} features until {formatDate(sub.renewsOn)}, then move to the Free plan.
        </p>
      )}
      {scheduledPlan && sub?.renewsOn && (
        <p className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2.5 text-sm text-olive-900">
          <span>Moving to <strong>{scheduledPlan.name}</strong> on {formatDate(sub.renewsOn)}.</span>
          <Button variant="outline" size="sm" onClick={onClearScheduled} disabled={busy}>Keep {plan?.name}</Button>
        </p>
      )}

      {paid && !ended && (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-sand-200 pt-5">
          {sub?.cancelAtPeriodEnd ? (
            <Button onClick={onResume} disabled={busy}>Resume subscription</Button>
          ) : (
            <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel subscription</Button>
          )}
        </div>
      )}
    </section>
  );
}
