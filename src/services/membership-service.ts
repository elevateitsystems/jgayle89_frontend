import { plans as seedPlans } from "@/lib/mock-data/membership";
import { invoices as seedInvoices, subscriptions as seedSubscriptions } from "@/lib/mock-data/subscriptions";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { daysFromToday } from "@/lib/date";
import { newId } from "@/lib/slug";
import { featuresFor } from "@/lib/mock-data/membership";
import { findSubscription, freePlan, plansFor } from "@/features/membership/access";
import type { BillingCycle, Invoice, MembershipPlan, PlanAudience, PlanFeatureValue, Subscription, SubscriptionStatus } from "@/types";

/**
 * Membership data-access layer (demo implementation).
 * Replace the bodies with calls to the Django REST API; signatures are async and return plain objects.
 * None of this is a security boundary — the API must authorize every change.
 */
export const planStore = createCollectionStore<MembershipPlan>("plans", seedPlans);
export const subscriptionStore = createCollectionStore<Subscription>("subscriptions", seedSubscriptions);
export const invoiceStore = createCollectionStore<Invoice>("invoices", seedInvoices);

export interface PlanInput {
  audience: PlanAudience;
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  active: boolean;
  highlighted: boolean;
  features: Record<string, PlanFeatureValue>;
}

const plansNow = () => planStore.getSnapshot();

/** Drops feature ids that don't belong to the audience and fills in missing ones, so plans never carry stray data. */
function normalizeFeatures(audience: PlanAudience, input: Record<string, PlanFeatureValue>) {
  const out: Record<string, PlanFeatureValue> = {};
  for (const def of featuresFor(audience)) {
    const v = input[def.id];
    // Essential features (public search, community resources, the public listing) can never be switched off.
    if (def.essential) out[def.id] = { enabled: true, limit: null };
    else if (def.kind === "limit") out[def.id] = { enabled: !!v?.enabled && v.limit !== 0, limit: v?.enabled ? (v.limit ?? null) : 0 };
    else out[def.id] = { enabled: !!v?.enabled, limit: null };
  }
  return out;
}

function assertNameFree(audience: PlanAudience, name: string, exceptId?: string) {
  const clash = plansNow().some((p) => p.audience === audience && p.id !== exceptId && p.name.trim().toLowerCase() === name.trim().toLowerCase());
  if (clash) throw new Error(`A ${audience} plan named “${name.trim()}” already exists.`);
}

export const planService = {
  async create(input: PlanInput): Promise<MembershipPlan> {
    await delay(450);
    assertNameFree(input.audience, input.name);
    const all = plansNow();
    const order = Math.max(0, ...plansFor(all, input.audience).map((p) => p.sortOrder)) + 1;
    const plan: MembershipPlan = {
      ...input,
      name: input.name.trim(),
      id: newId("plan"),
      sortOrder: order,
      features: normalizeFeatures(input.audience, input.features),
      adAllowances: {},
      stripe: { monthlyPriceId: null, annualPriceId: null },
      createdAt: daysFromToday(0),
    };
    planStore.set([...all, plan]);
    return plan;
  },

  /** Edits a plan. Audience can't change after creation. */
  async update(id: string, input: Partial<Omit<PlanInput, "audience">> & { adAllowances?: Record<string, number> }): Promise<MembershipPlan> {
    await delay(450);
    const all = plansNow();
    const current = all.find((p) => p.id === id);
    if (!current) throw new Error("Plan not found.");
    if (input.name !== undefined) assertNameFree(current.audience, input.name, id);
    const next: MembershipPlan = {
      ...current,
      ...input,
      name: input.name !== undefined ? input.name.trim() : current.name,
      features: input.features ? normalizeFeatures(current.audience, input.features) : current.features,
    };
    planStore.set(all.map((p) => (p.id === id ? next : p)));
    return next;
  },

  async setActive(id: string, active: boolean): Promise<MembershipPlan> {
    await delay(250);
    const all = plansNow();
    const current = all.find((p) => p.id === id);
    if (!current) throw new Error("Plan not found.");
    if (!active) {
      const stillActive = plansFor(all, current.audience, { activeOnly: true }).filter((p) => p.id !== id);
      if (stillActive.length === 0) throw new Error("At least one plan must stay active for each audience.");
      if (current.id === freePlan(all, current.audience)?.id && !stillActive.some((p) => p.monthlyPrice === 0)) {
        throw new Error("The free plan can't be deactivated — it is the fallback for people without a paid plan.");
      }
    }
    return planService.update(id, { active });
  },

  subscriberCount(planId: string): number {
    return subscriptionStore.getSnapshot().filter((s) => s.planId === planId && s.status !== "canceled" && s.status !== "expired").length;
  },

  async remove(id: string): Promise<void> {
    await delay(300);
    if (planService.subscriberCount(id) > 0) throw new Error("This plan has active subscribers. Deactivate it instead of deleting it.");
    const current = plansNow().find((p) => p.id === id);
    if (current && current.id === freePlan(plansNow(), current.audience)?.id) throw new Error("The free plan can't be deleted.");
    planStore.set(plansNow().filter((p) => p.id !== id));
  },

  reset() {
    planStore.reset();
  },
};

function patchSub(id: string, changes: Partial<Subscription>) {
  const all = subscriptionStore.getSnapshot();
  const current = all.find((s) => s.id === id);
  if (!current) throw new Error("Subscription not found.");
  const next = { ...current, ...changes };
  subscriptionStore.set(all.map((s) => (s.id === id ? next : s)));
  return next;
}

/** Who is acting. Mirrors what the API will derive from the auth token. */
export interface Actor {
  id: string;
  role: "admin" | "staff" | "user";
}

function assertCanManage(sub: Subscription, actor: Actor) {
  if (actor.role !== "admin" && sub.ownerId !== actor.id) throw new Error("You can only manage your own subscriptions.");
}

export const subscriptionService = {
  /**
   * Downgrades never need payment, so they're scheduled for the end of the current period.
   * Upgrades go through `createCheckoutSession` (see payments-service) — they are NOT applied here.
   */
  async scheduleChange(subId: string, planId: string, actor: Actor): Promise<Subscription> {
    await delay(400);
    const sub = subscriptionStore.getSnapshot().find((s) => s.id === subId);
    if (!sub) throw new Error("Subscription not found.");
    assertCanManage(sub, actor);
    const target = plansNow().find((p) => p.id === planId);
    const current = plansNow().find((p) => p.id === sub.planId);
    if (!target || target.audience !== sub.audience) throw new Error("That plan isn't available.");
    if (current && target.sortOrder >= current.sortOrder) throw new Error("Only downgrades can be scheduled here. Upgrades require checkout.");
    return patchSub(subId, { scheduledPlanId: planId, cancelAtPeriodEnd: false });
  },

  async clearScheduledChange(subId: string, actor: Actor): Promise<Subscription> {
    await delay(250);
    const sub = subscriptionStore.getSnapshot().find((s) => s.id === subId);
    if (!sub) throw new Error("Subscription not found.");
    assertCanManage(sub, actor);
    return patchSub(subId, { scheduledPlanId: null });
  },

  /** Cancels at the end of the paid period; access continues until then. */
  async cancel(subId: string, actor: Actor): Promise<Subscription> {
    await delay(500);
    const sub = subscriptionStore.getSnapshot().find((s) => s.id === subId);
    if (!sub) throw new Error("Subscription not found.");
    assertCanManage(sub, actor);
    return patchSub(subId, { cancelAtPeriodEnd: true, scheduledPlanId: null });
  },

  async resume(subId: string, actor: Actor): Promise<Subscription> {
    await delay(400);
    const sub = subscriptionStore.getSnapshot().find((s) => s.id === subId);
    if (!sub) throw new Error("Subscription not found.");
    assertCanManage(sub, actor);
    if (sub.status === "canceled" || sub.status === "expired") throw new Error("This subscription has ended. Start a new plan from checkout.");
    return patchSub(subId, { cancelAtPeriodEnd: false });
  },

  /**
   * ADMIN OVERRIDE: assign a plan without payment (comps, support fixes, corrections).
   * This is an administrative action, not a purchase, so it is the only path that changes a plan immediately.
   */
  async adminAssign(input: { audience: PlanAudience; subjectId: string; ownerId: string; planId: string; cycle: BillingCycle; status?: SubscriptionStatus }, actor: Actor): Promise<Subscription> {
    await delay(450);
    if (actor.role !== "admin") throw new Error("Only administrators can assign plans.");
    const plan = plansNow().find((p) => p.id === input.planId);
    if (!plan || plan.audience !== input.audience) throw new Error("That plan isn't available for this account.");
    const existing = findSubscription(subscriptionStore.getSnapshot(), input.audience, input.subjectId);
    const renewsOn = plan.monthlyPrice === 0 ? null : daysFromToday(input.cycle === "annual" ? 365 : 30);
    const changes: Partial<Subscription> = {
      planId: input.planId, cycle: input.cycle, status: input.status ?? "active", renewsOn,
      cancelAtPeriodEnd: false, scheduledPlanId: null, canceledOn: undefined,
    };
    if (existing) return patchSub(existing.id, changes);
    const sub: Subscription = {
      id: newId("sub"), audience: input.audience, subjectId: input.subjectId, ownerId: input.ownerId,
      startedOn: daysFromToday(0), ...(changes as Required<Pick<Subscription, "planId" | "cycle" | "status" | "renewsOn" | "cancelAtPeriodEnd" | "scheduledPlanId">>),
    };
    subscriptionStore.set([...subscriptionStore.getSnapshot(), sub]);
    return sub;
  },

  async adminSetStatus(subId: string, status: SubscriptionStatus, actor: Actor): Promise<Subscription> {
    await delay(300);
    if (actor.role !== "admin") throw new Error("Only administrators can change subscription status.");
    return patchSub(subId, { status, ...(status === "canceled" ? { canceledOn: daysFromToday(0), renewsOn: null } : {}) });
  },

  reset() {
    subscriptionStore.reset();
    invoiceStore.reset();
  },
};
