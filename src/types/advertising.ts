/** Advertising & sponsorship marketplace. Purchases are separate from membership subscriptions. */

export type AdProductKind =
  | "featured_search"
  | "featured_category"
  | "homepage_featured"
  | "geo_sponsorship"
  | "event_sponsorship"
  | "newsletter_sponsorship"
  | "resource_sponsorship"
  | "premium_banner";

/** Advertising = promotes a business listing. Sponsorship = sponsors a place, event, resource or newsletter. */
export type AdFamily = "advertising" | "sponsorship";
export type AdTargeting = "none" | "category" | "geo" | "event" | "resource";
export type AdLabel = "Sponsored" | "Advertisement";

export interface AdDurationOption {
  days: number;
  price: number; // USD
}

export interface AdProduct {
  id: string;
  kind: AdProductKind;
  family: AdFamily;
  name: string;
  description: string;
  /** Plain-language description of where it appears on the public site. */
  placement: string;
  /** Public label that must accompany every placement of this product. */
  label: AdLabel;
  targeting: AdTargeting;
  durations: AdDurationOption[];
  /** Concurrent campaigns allowed. */
  totalSlots: number;
  active: boolean;
  needsImage: boolean;
  needsLogo: boolean;
  imageSpec: string;
}

export type CampaignStatus =
  | "draft"
  | "pending_review"
  | "changes_requested"
  | "rejected"
  | "approved"
  | "scheduled"
  | "completed"
  | "expired";

/** `active` is derived from dates + payment, never stored. */
export type CampaignDisplayStatus = CampaignStatus | "active";

export type PaymentStatus = "unpaid" | "paid" | "credit" | "refunded";

export interface CampaignTargeting {
  categoryIds: string[];
  states: string[];
  city: string;
  eventId: string;
  resourceId: string;
}

export interface CampaignCreative {
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  image: string;
  logo: string;
}

export interface CampaignEvent {
  at: string; // ISO datetime
  by: string;
  action: "submitted" | "resubmitted" | "approved" | "rejected" | "changes_requested" | "scheduled";
  note?: string;
}

export interface AdCampaign {
  id: string;
  productId: string;
  businessId: string;
  businessName: string;
  ownerId: string;
  name: string;
  status: CampaignStatus;
  durationDays: number;
  price: number;
  creditApplied: number;
  paymentStatus: PaymentStatus;
  targeting: CampaignTargeting;
  creative: CampaignCreative;
  requestedStart: string; // ISO date
  startDate?: string;
  endDate?: string;
  impressions: number;
  clicks: number;
  reviewerName?: string;
  reviewNote?: string;
  history: CampaignEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface PromoCredit {
  id: string;
  businessId: string;
  businessName: string;
  amount: number;
  remaining: number;
  reason: string;
  grantedOn: string;
  expiresOn: string;
}
