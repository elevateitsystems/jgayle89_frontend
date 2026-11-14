import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { FeatureList } from "./feature-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatPrice, monthlyEquivalent, priceFor } from "@/features/membership/access";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { BillingCycle, MembershipPlan, PlanFeatureDef } from "@/types";

export type PlanCardState = "current" | "upgrade" | "downgrade" | "scheduled" | "cycle" | "public";

interface Props {
  plan: MembershipPlan;
  defs: PlanFeatureDef[];
  cycle: BillingCycle;
  state: PlanCardState;
  /** Called when the CTA is clicked (not for `current` / `scheduled`). */
  onSelect?: (plan: MembershipPlan) => void;
  /** Date a scheduled downgrade takes effect. */
  scheduledFor?: string | null;
  /** Plan is deactivated but this account is still on it. */
  legacy?: boolean;
  /** Override the CTA text (public pages). */
  ctaLabel?: string;
  busy?: boolean;
  /** Public pricing page: the CTA is a link (sign-up / dashboard) instead of a button. */
  href?: string;
}

/** Pricing card. Pure presentation — what "selecting" does is up to the parent. */
export function PlanCard({ plan, defs, cycle, state, onSelect, scheduledFor, legacy, ctaLabel, busy, href }: Props) {
  const free = plan.monthlyPrice === 0;
  const price = priceFor(plan, cycle);
  const isCurrent = state === "current";
  const label =
    ctaLabel ??
    (state === "upgrade" ? `Upgrade to ${plan.name}` : state === "downgrade" ? `Downgrade to ${plan.name}` : state === "cycle" ? `Switch to ${cycle} billing` : state === "public" ? `Choose ${plan.name}` : "");

  return (
    <article
      aria-label={`${plan.name} plan`}
      className={cn(
        "relative flex h-full flex-col rounded-lg border bg-card p-6 shadow-card",
        isCurrent && "border-olive-600 ring-1 ring-olive-600",
        !isCurrent && plan.highlighted && "border-brass/60 shadow-lift",
      )}
    >
      <div className="flex min-h-6 flex-wrap items-center gap-2">
        {isCurrent && <span className="rounded-full bg-olive-700 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">Current plan</span>}
        {plan.highlighted && !isCurrent && <span className="rounded-full bg-brass px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-white">Most popular</span>}
        {legacy && <span className="rounded-full bg-sand-200 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-sand-700">Legacy plan</span>}
      </div>

      <h3 className="mt-3 text-2xl font-semibold text-olive-950">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

      <p className="mt-5 flex items-baseline gap-1.5">
        <span className="font-heading text-4xl font-semibold tabular-nums text-olive-950">{free ? "Free" : formatPrice(cycle === "annual" ? monthlyEquivalent(plan) : price)}</span>
        {!free && <span className="text-sm text-muted-foreground">/ month</span>}
      </p>
      <p className="mt-1 h-5 text-xs text-muted-foreground">
        {free ? "No payment needed" : cycle === "annual" ? `Billed ${formatPrice(plan.annualPrice)} per year` : "Billed monthly"}
      </p>

      <div className="mt-5 flex-1 border-t border-sand-200 pt-5">
        <FeatureList plan={plan} defs={defs} max={7} />
      </div>

      <div className="mt-6">
        {state === "current" ? (
          <Button variant="outline" size="lg" className="w-full" disabled>Your current plan</Button>
        ) : state === "scheduled" ? (
          <Button variant="outline" size="lg" className="w-full" disabled>
            <CalendarClock /> Starts {scheduledFor ? formatDate(scheduledFor) : "next renewal"}
          </Button>
        ) : href ? (
          <Link href={href} className={cn(buttonVariants({ size: "lg", variant: plan.highlighted ? "default" : "outline" }), "w-full")}>
            {label}
          </Link>
        ) : (
          <Button
            size="lg"
            className="w-full"
            variant={state === "upgrade" || state === "public" || state === "cycle" ? "default" : "outline"}
            disabled={busy}
            onClick={() => onSelect?.(plan)}
          >
            {label}
          </Button>
        )}
      </div>
    </article>
  );
}
