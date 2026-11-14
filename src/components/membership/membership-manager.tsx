"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BillingHistory } from "./billing-history";
import { CheckoutDialog } from "./checkout-dialog";
import { PlanCard, type PlanCardState } from "./plan-card";
import { PlanComparisonTable } from "./plan-comparison-table";
import { PricingToggle } from "./pricing-toggle";
import { SubscriptionSummary } from "./subscription-summary";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Panel } from "@/components/dashboard/panel";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdProducts } from "@/features/advertising/hooks";
import { annualSavingsPercent, formatPrice, freePlan, isLapsed, plansFor, planChange, priceFor } from "@/features/membership/access";
import { useAllPlans, useInvoices, useResolvedPlan, useSubscriptionFor } from "@/features/membership/hooks";
import { useSimulatedLoading } from "@/hooks/use-store";
import { featuresFor } from "@/lib/mock-data/membership";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { subscriptionService } from "@/services/membership-service";
import type { CheckoutRequest } from "@/services/payments-service";
import type { AppUser, BillingCycle, MembershipPlan, PlanAudience } from "@/types";

interface ManageProps {
  mode: "manage";
  audience: PlanAudience;
  /** AppUser.id for member plans, Business.id for business plans. */
  subjectId: string;
  /** Business name, shown above the plan summary. */
  subjectLabel?: string;
  user: AppUser;
}
interface PublicProps {
  mode: "public";
  audience: PlanAudience;
  /** Where the plan CTAs go (sign-up or the member's membership page). */
  ctaHref: (plan: MembershipPlan) => string;
  ctaLabel: (plan: MembershipPlan) => string;
}

/**
 * The complete membership experience for one audience: plan cards with a monthly/annual toggle, current-plan
 * indicator, upgrade (Stripe placeholder) / downgrade (scheduled) / cancel flows, comparison table and billing history.
 * In `public` mode it is the read-only pricing page with sign-up links.
 */
export function MembershipManager(props: ManageProps | PublicProps) {
  const { audience } = props;
  const allPlans = useAllPlans();
  const products = useAdProducts();
  const loading = useSimulatedLoading(300);
  const defs = useMemo(() => featuresFor(audience), [audience]);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const subjectId = props.mode === "manage" ? props.subjectId : undefined;
  const sub = useSubscriptionFor(audience, subjectId);
  const current = useResolvedPlan(audience, subjectId);
  const invoices = useInvoices();

  const [checkout, setCheckout] = useState<CheckoutRequest | null>(null);
  const [downgradeTo, setDowngradeTo] = useState<MembershipPlan | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [busy, setBusy] = useState(false);

  const active = useMemo(() => plansFor(allPlans, audience, { activeOnly: true }), [allPlans, audience]);
  // A deactivated plan stays visible to the account that is still on it, flagged as legacy.
  const visible = useMemo(() => (current && !active.some((p) => p.id === current.id) ? [...active, current].sort((a, b) => a.sortOrder - b.sortOrder) : active), [active, current]);
  const maxSaving = Math.max(0, ...visible.map(annualSavingsPercent));
  const scheduledPlan = sub?.scheduledPlanId ? allPlans.find((p) => p.id === sub.scheduledPlanId) : undefined;

  const myInvoices = useMemo(
    () => (props.mode === "manage" ? invoices.filter((i) => (audience === "business" ? i.businessId === props.subjectId : i.userId === props.user.id && !i.businessId)) : []),
    [invoices, audience, props],
  );

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading plans">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      </div>
    );
  }

  function stateFor(plan: MembershipPlan): PlanCardState {
    if (props.mode === "public") return "public";
    if (sub?.scheduledPlanId === plan.id) return "scheduled";
    const change = planChange(current, plan);
    if (change === "current") {
      const paid = plan.monthlyPrice > 0 && !isLapsed(sub);
      return paid && sub && sub.cycle !== cycle ? "cycle" : "current";
    }
    return change;
  }

  function startCheckout(plan: MembershipPlan, kind: "upgrade" | "cycle") {
    if (props.mode !== "manage") return;
    const label = props.audience === "business" && props.subjectLabel ? ` for ${props.subjectLabel}` : "";
    setCheckout({
      kind: "membership",
      description: `${plan.name} plan — ${cycle}${label}`,
      amountUsd: priceFor(plan, cycle),
      metadata: { planId: plan.id, cycle, audience, subjectId: props.subjectId, change: kind },
    });
  }

  function select(plan: MembershipPlan) {
    if (props.mode === "public") return;
    const s = stateFor(plan);
    if (s === "upgrade" || s === "cycle") startCheckout(plan, s);
    else if (s === "downgrade") setDowngradeTo(plan);
  }

  const actor = props.mode === "manage" ? { id: props.user.id, role: props.user.role } : null;

  async function run<T>(fn: () => Promise<T>, success: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
    } catch (e) {
      toast.error("Couldn't update the subscription", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  const downgradeFree = downgradeTo && downgradeTo.monthlyPrice === 0;

  return (
    <div className="space-y-8">
      {props.mode === "manage" && (
        <SubscriptionSummary
          plan={current}
          subscription={sub}
          scheduledPlan={scheduledPlan}
          subjectLabel={props.subjectLabel}
          busy={busy}
          onCancel={() => setCancelling(true)}
          onResume={() => sub && actor && run(() => subscriptionService.resume(sub.id, actor), "Subscription resumed")}
          onClearScheduled={() => sub && actor && run(() => subscriptionService.clearScheduledChange(sub.id, actor), "Scheduled change removed")}
        />
      )}

      <section aria-labelledby="plans-h">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="plans-h" className="text-xl font-semibold text-olive-950">{props.mode === "manage" ? "Change your plan" : "Choose a plan"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upgrades are paid through Stripe Checkout. Downgrades take effect at your next renewal.
              {audience === "business" && " Verification badges are earned through review — no plan includes them."}
            </p>
          </div>
          <PricingToggle value={cycle} onChange={setCycle} savingsLabel={maxSaving > 0 ? `Save up to ${maxSaving}%` : undefined} />
        </div>

        <div className={cn("mt-6 grid gap-5 sm:grid-cols-2", visible.length >= 4 ? "xl:grid-cols-4" : "lg:grid-cols-3")}>
          {visible.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              defs={defs}
              cycle={cycle}
              state={stateFor(plan)}
              legacy={!plan.active}
              busy={busy}
              scheduledFor={sub?.renewsOn}
              onSelect={select}
              href={props.mode === "public" ? props.ctaHref(plan) : undefined}
              ctaLabel={props.mode === "public" ? props.ctaLabel(plan) : undefined}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="compare-h">
        <h2 id="compare-h" className="mb-4 text-xl font-semibold text-olive-950">Compare plans</h2>
        <PlanComparisonTable plans={visible} defs={defs} cycle={cycle} currentPlanId={props.mode === "manage" ? current?.id : undefined} showAdAllowances={audience === "business"} products={products} />
      </section>

      {props.mode === "manage" && (
        <Panel title="Billing history" subtitle="Membership charges only. Advertising purchases are listed under Payment History.">
          <BillingHistory invoices={myInvoices.filter((i) => i.kind === "membership")} />
        </Panel>
      )}

      {props.mode === "public" && <PublicCtaNote />}

      <CheckoutDialog open={!!checkout} onOpenChange={(o) => !o && setCheckout(null)} request={checkout} />

      <ConfirmDialog
        open={!!downgradeTo}
        onOpenChange={(o) => !o && setDowngradeTo(null)}
        title={downgradeFree ? "Downgrade to Free?" : `Downgrade to ${downgradeTo?.name}?`}
        description={
          <>
            You keep your current {current?.name} features until {sub?.renewsOn ? formatDate(sub.renewsOn) : "the end of this billing period"}. After that you&apos;ll be on {downgradeTo?.name}
            {downgradeTo && downgradeTo.monthlyPrice > 0 ? ` at ${formatPrice(priceFor(downgradeTo, sub?.cycle ?? cycle))}` : ""}. You can undo this any time before then.
          </>
        }
        confirmLabel="Schedule downgrade"
        busyLabel="Scheduling…"
        successMessage="Downgrade scheduled"
        onConfirm={async () => {
          if (!sub || !downgradeTo || !actor) throw new Error("There is no paid subscription to downgrade.");
          await subscriptionService.scheduleChange(sub.id, downgradeTo.id, actor);
        }}
      />

      <ConfirmDialog
        open={cancelling}
        onOpenChange={setCancelling}
        destructive
        title="Cancel your subscription?"
        description={
          <>
            You&apos;ll keep {current?.name} features until {sub?.renewsOn ? formatDate(sub.renewsOn) : "the end of this billing period"}, then move to the {freePlan(allPlans, audience)?.name ?? "Free"} plan.
            Public business search and community resources stay free. You can resume any time before then.
          </>
        }
        confirmLabel="Cancel subscription"
        busyLabel="Canceling…"
        successMessage="Subscription set to cancel at the end of the period"
        onConfirm={async () => {
          if (!sub || !actor) throw new Error("There is no subscription to cancel.");
          await subscriptionService.cancel(sub.id, actor);
        }}
      />
    </div>
  );
}

function PublicCtaNote() {
  return (
    <p className="text-center text-sm text-muted-foreground">
      Searching the business directory and browsing community resources is always free — no membership required.{" "}
      <Link href="/directory" className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}>Browse the directory</Link>
    </p>
  );
}
