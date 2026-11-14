/**
 * Pure membership rules: which plan a person/business is on, what it includes, and how plans compare.
 * No React, no storage — everything takes plain arrays so it is trivially testable and API-agnostic.
 * NOTE: this only decides what the UI shows. The backend must enforce plan limits on every request.
 */
import type {
  BillingCycle, MembershipPlan, PlanAudience, PlanFeatureDef, PlanFeatureValue, Subscription,
} from "../../types/index.ts";

export const byOrder = (a: MembershipPlan, b: MembershipPlan) => a.sortOrder - b.sortOrder;

export function plansFor(plans: MembershipPlan[], audience: PlanAudience, opts: { activeOnly?: boolean } = {}) {
  return plans.filter((p) => p.audience === audience && (!opts.activeOnly || p.active)).sort(byOrder);
}

/** The audience's entry-level plan: the free plan if one exists, otherwise the lowest-ordered one. */
export function freePlan(plans: MembershipPlan[], audience: PlanAudience): MembershipPlan | undefined {
  const list = plansFor(plans, audience);
  return list.find((p) => p.monthlyPrice === 0) ?? list[0];
}

export function findSubscription(subs: Subscription[], audience: PlanAudience, subjectId: string): Subscription | undefined {
  return subs.find((s) => s.audience === audience && s.subjectId === subjectId);
}

/** Subscriptions that no longer grant paid features. (`past_due` keeps access during the grace period.) */
export const isLapsed = (s: Subscription | undefined) => !s || s.status === "canceled" || s.status === "expired";

/** The plan whose features apply right now: the subscribed plan, or Free when there is no live subscription. */
export function resolvePlan(plans: MembershipPlan[], subs: Subscription[], audience: PlanAudience, subjectId: string): MembershipPlan | undefined {
  const sub = findSubscription(subs, audience, subjectId);
  if (sub && !isLapsed(sub)) {
    const plan = plans.find((p) => p.id === sub.planId);
    if (plan) return plan;
  }
  return freePlan(plans, audience);
}

export function featureValue(plan: MembershipPlan | undefined, featureId: string): PlanFeatureValue {
  return plan?.features[featureId] ?? { enabled: false, limit: 0 };
}

export const hasFeature = (plan: MembershipPlan | undefined, featureId: string) => featureValue(plan, featureId).enabled;

/** `null` = unlimited, `0` = not included. */
export function limitOf(plan: MembershipPlan | undefined, featureId: string): number | null {
  const v = featureValue(plan, featureId);
  if (!v.enabled) return 0;
  return v.limit;
}

export interface UsageState {
  limit: number | null;
  used: number;
  remaining: number | null;
  unlimited: boolean;
  included: boolean;
  atLimit: boolean;
}

export function usageState(plan: MembershipPlan | undefined, featureId: string, used: number): UsageState {
  const limit = limitOf(plan, featureId);
  const unlimited = limit === null;
  return {
    limit,
    used,
    unlimited,
    included: unlimited || limit > 0,
    remaining: unlimited ? null : Math.max(0, limit - used),
    atLimit: !unlimited && used >= limit,
  };
}

export function formatLimit(def: PlanFeatureDef, v: PlanFeatureValue): string {
  if (!v.enabled) return "Not included";
  if (def.kind === "toggle") return "Included";
  if (v.limit === null) return "Unlimited";
  return `${v.limit.toLocaleString()}${def.unit ? ` ${def.unit}` : ""}`;
}

export type PlanChange = "current" | "upgrade" | "downgrade";

export function planChange(current: MembershipPlan | undefined, target: MembershipPlan): PlanChange {
  if (!current) return "upgrade";
  if (current.id === target.id) return "current";
  return target.sortOrder > current.sortOrder ? "upgrade" : "downgrade";
}

export const priceFor = (plan: MembershipPlan, cycle: BillingCycle) => (cycle === "annual" ? plan.annualPrice : plan.monthlyPrice);

/** Per-month price when billed annually, for display. */
export const monthlyEquivalent = (plan: MembershipPlan) => plan.annualPrice / 12;

/** Whole-number % saved by paying annually (0 when there is no saving or the plan is free). */
export function annualSavingsPercent(plan: MembershipPlan): number {
  const full = plan.monthlyPrice * 12;
  if (full <= 0 || plan.annualPrice <= 0) return 0;
  return Math.max(0, Math.round((1 - plan.annualPrice / full) * 100));
}

export function formatPrice(amount: number): string {
  return amount === 0 ? "$0" : `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}

/** First active plan in the audience that includes the feature — for "Upgrade to …" copy. */
export function cheapestPlanWith(plans: MembershipPlan[], audience: PlanAudience, featureId: string): MembershipPlan | undefined {
  return plansFor(plans, audience, { activeOnly: true }).find((p) => hasFeature(p, featureId));
}

export type SubscriptionTone = "good" | "warn" | "bad" | "neutral";

export function describeSubscription(sub: Subscription | undefined): { label: string; tone: SubscriptionTone } {
  if (!sub) return { label: "Free plan", tone: "neutral" };
  if (sub.status === "past_due") return { label: "Payment past due", tone: "bad" };
  if (sub.status === "canceled") return { label: "Canceled", tone: "neutral" };
  if (sub.status === "expired") return { label: "Expired", tone: "neutral" };
  if (sub.cancelAtPeriodEnd) return { label: "Cancels at period end", tone: "warn" };
  if (sub.status === "trialing") return { label: "Trial", tone: "good" };
  return { label: "Active", tone: "good" };
}

/** Group an audience's features by comparison-table section, preserving order. */
export function groupFeatures(defs: PlanFeatureDef[]): { group: string; features: PlanFeatureDef[] }[] {
  const out: { group: string; features: PlanFeatureDef[] }[] = [];
  for (const f of defs) {
    const g = out.find((x) => x.group === f.group);
    if (g) g.features.push(f);
    else out.push({ group: f.group, features: [f] });
  }
  return out;
}
