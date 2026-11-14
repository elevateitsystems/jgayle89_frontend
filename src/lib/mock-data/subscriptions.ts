import { addDays, daysBetween, daysFromToday } from "../date.ts";
import { campaigns } from "./advertising.ts";
import { plans } from "./membership.ts";
import type { BillingCycle, Invoice, Subscription, SubscriptionStatus } from "../../types/index.ts";

/**
 * DEMO DATA — subscriptions and billing history. Accounts with no record are on the audience's Free plan.
 * Member subscriptions use AppUser ids; business subscriptions use Business ids (see data/users.ts, data/businesses.ts).
 */
interface Seed {
  n: number;
  audience: Subscription["audience"];
  subjectId: string;
  ownerId: string;
  planId: string;
  cycle: BillingCycle;
  status?: SubscriptionStatus;
  renewsIn: number;
  cancelAtPeriodEnd?: boolean;
  scheduledPlanId?: string;
  startedAgo: number;
}

const seeds: Seed[] = [
  { n: 1, audience: "veteran", subjectId: "usr_005", ownerId: "usr_005", planId: "plan_vet_plus", cycle: "monthly", renewsIn: 12, startedAgo: 170 },
  { n: 2, audience: "veteran", subjectId: "usr_007", ownerId: "usr_007", planId: "plan_vet_pro", cycle: "annual", renewsIn: 210, startedAgo: 155 },
  { n: 3, audience: "civilian", subjectId: "usr_008", ownerId: "usr_008", planId: "plan_civ_plus", cycle: "monthly", renewsIn: 21, startedAgo: 90 },
  { n: 4, audience: "civilian", subjectId: "usr_010", ownerId: "usr_010", planId: "plan_civ_plus", cycle: "annual", renewsIn: 300, cancelAtPeriodEnd: true, startedAgo: 65 },
  { n: 5, audience: "veteran", subjectId: "usr_012", ownerId: "usr_012", planId: "plan_vet_plus", cycle: "monthly", status: "past_due", renewsIn: -2, startedAgo: 120 },
  { n: 6, audience: "veteran", subjectId: "usr_011", ownerId: "usr_011", planId: "plan_vet_plus", cycle: "monthly", status: "canceled", renewsIn: -20, startedAgo: 200 },
  // Business subscriptions (subjectId = Business.id)
  { n: 7, audience: "business", subjectId: "biz_001", ownerId: "usr_014", planId: "plan_biz_pro", cycle: "annual", renewsIn: 187, startedAgo: 178 },
  { n: 8, audience: "business", subjectId: "biz_006", ownerId: "usr_014", planId: "plan_biz_growth", cycle: "monthly", renewsIn: 9, scheduledPlanId: "plan_biz_free", startedAgo: 140 },
  { n: 9, audience: "business", subjectId: "biz_002", ownerId: "usr_015", planId: "plan_biz_growth", cycle: "monthly", renewsIn: 17, startedAgo: 105 },
  { n: 10, audience: "business", subjectId: "biz_005", ownerId: "usr_016", planId: "plan_biz_exec", cycle: "annual", renewsIn: 262, startedAgo: 103 },
  { n: 11, audience: "business", subjectId: "biz_010", ownerId: "usr_016", planId: "plan_biz_pro", cycle: "monthly", status: "past_due", renewsIn: -1, startedAgo: 60 },
  { n: 12, audience: "business", subjectId: "biz_011", ownerId: "usr_017", planId: "plan_biz_growth", cycle: "annual", renewsIn: 120, startedAgo: 245 },
];

export const subscriptions: Subscription[] = seeds.map((s) => ({
  id: `sub_${String(s.n).padStart(3, "0")}`,
  audience: s.audience,
  subjectId: s.subjectId,
  ownerId: s.ownerId,
  planId: s.planId,
  cycle: s.cycle,
  status: s.status ?? "active",
  startedOn: daysFromToday(-s.startedAgo),
  renewsOn: s.status === "canceled" ? null : daysFromToday(s.renewsIn),
  cancelAtPeriodEnd: s.cancelAtPeriodEnd ?? false,
  scheduledPlanId: s.scheduledPlanId ?? null,
  ...(s.status === "canceled" ? { canceledOn: daysFromToday(-20) } : {}),
}));

const planById = new Map(plans.map((p) => [p.id, p]));

function membershipInvoices(): Invoice[] {
  const out: Invoice[] = [];
  let n = 1;
  for (const s of subscriptions) {
    const plan = planById.get(s.planId);
    if (!plan || plan.monthlyPrice === 0) continue;
    const isAnnual = s.cycle === "annual";
    const step = isAnnual ? 365 : 30;
    // Charges happen every `step` days, counting back from the renewal (or cancellation) date, never before the start date.
    const anchor = s.renewsOn ?? s.canceledOn ?? daysFromToday(0);
    for (let i = 1; i <= 4; i++) {
      const date = addDays(daysBetween(daysFromToday(0), anchor) - step * i);
      if (date < s.startedOn || date > daysFromToday(0)) continue;
      out.push({
        id: `inv_${String(n++).padStart(4, "0")}`, kind: "membership", userId: s.ownerId, businessId: s.audience === "business" ? s.subjectId : undefined,
        description: `${plan.name} plan — ${isAnnual ? "annual" : "monthly"}`,
        amount: isAnnual ? plan.annualPrice : plan.monthlyPrice,
        status: s.status === "past_due" && i === 1 ? "failed" : "paid",
        date, reference: `in_demo_${s.id}_${i}`, subscriptionId: s.id,
      });
    }
  }
  return out;
}

function advertisingInvoices(): Invoice[] {
  return campaigns
    .filter((c) => c.paymentStatus === "paid" || c.paymentStatus === "credit")
    .map((c, i) => ({
      id: `inv_ad_${String(i + 1).padStart(3, "0")}`, kind: "advertising" as const, userId: c.ownerId, businessId: c.businessId,
      description: `${c.name} (${c.durationDays}-day campaign)`, amount: c.price - c.creditApplied, status: "paid" as const,
      date: c.startDate ?? c.requestedStart, reference: `pi_demo_${c.id}`, campaignId: c.id,
    }))
    .filter((i) => i.amount > 0);
}

export const invoices: Invoice[] = [...membershipInvoices(), ...advertisingInvoices()].sort((a, b) => b.date.localeCompare(a.date));
