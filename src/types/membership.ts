/** Membership plans, features and billing. Pure data shapes — no behaviour. */

export type PlanAudience = "veteran" | "civilian" | "business";
export type BillingCycle = "monthly" | "annual";

export type FeatureKind = "toggle" | "limit";

/** One row in the feature comparison table. Plans reference these by id. */
export interface PlanFeatureDef {
  id: string;
  label: string;
  description: string;
  audiences: PlanAudience[];
  kind: FeatureKind;
  /** Display unit for limit features, e.g. "photos" or "per month". */
  unit?: string;
  /** Section heading in the comparison table. */
  group: string;
  /**
   * Essential features are never paywalled: public business search and core community
   * resources must stay free, so the admin UI cannot switch these off for any plan.
   */
  essential?: boolean;
}

export interface PlanFeatureValue {
  enabled: boolean;
  /** Limit features only. `null` means unlimited. */
  limit: number | null;
}

export interface MembershipPlan {
  id: string;
  audience: PlanAudience;
  name: string;
  tagline: string;
  description: string;
  monthlyPrice: number; // USD, 0 = free
  annualPrice: number; // USD per year
  active: boolean;
  highlighted: boolean; // "Most popular" ribbon
  sortOrder: number;
  features: Record<string, PlanFeatureValue>;
  /** Advertising products included per month with this plan: AdProduct.id → included placements. */
  adAllowances: Record<string, number>;
  /** Stripe Price ids. Placeholders until the Stripe integration is connected. */
  stripe: { monthlyPriceId: string | null; annualPriceId: string | null };
  createdAt: string;
}

export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "expired";

export interface Subscription {
  id: string;
  audience: PlanAudience;
  /** AppUser.id for member plans, Business.id for business plans. */
  subjectId: string;
  /** The AppUser who pays. */
  ownerId: string;
  planId: string;
  cycle: BillingCycle;
  status: SubscriptionStatus;
  startedOn: string; // ISO date
  renewsOn: string | null; // null for free plans
  cancelAtPeriodEnd: boolean;
  /** A downgrade that takes effect at the next renewal. */
  scheduledPlanId: string | null;
  canceledOn?: string;
}

export type InvoiceKind = "membership" | "advertising";
export type InvoiceStatus = "paid" | "pending" | "failed" | "refunded";

export interface Invoice {
  id: string;
  kind: InvoiceKind;
  userId: string;
  businessId?: string;
  description: string;
  amount: number; // USD
  status: InvoiceStatus;
  date: string; // ISO date
  /** Stripe invoice / payment-intent id once connected. */
  reference: string;
  subscriptionId?: string;
  campaignId?: string;
}
