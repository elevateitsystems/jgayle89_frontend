/** Additional Services Marketplace: catalogue, promotions and purchase records. */

export type ServiceAudience = "member" | "business";
export type ServiceAvailability = "active" | "inactive" | "coming_soon";

export interface ServiceListing {
  id: string;
  audience: ServiceAudience;
  name: string;
  shortDescription: string;
  description: string;
  price: number; // USD
  /** e.g. "per session", "one-time". */
  priceUnit: string;
  included: string[];
  /** MembershipPlan ids that may buy this service. */
  eligiblePlanIds: string[];
  availability: ServiceAvailability;
  image?: string;
  sortOrder: number;
  createdAt: string;
}

export type PromotionKind = "percent_off" | "amount_off" | "free_months" | "free_consultation" | "member_price";
export type PromotionApproval = "approved" | "pending" | "rejected";

export interface ServicePromotion {
  id: string;
  name: string;
  kind: PromotionKind;
  /** percent_off: 10 = 10%; amount_off: USD; free_months: months; member_price: the price in USD. */
  value: number;
  /** Empty = applies automatically (no code needed). */
  couponCode: string;
  /** Plan ids the promotion is limited to. Empty = every plan. */
  planIds: string[];
  /** Service ids it applies to. Empty = every service. */
  serviceIds: string[];
  startsOn: string; // ISO date
  endsOn?: string; // ISO date
  active: boolean;
  /** Staff without the discount permission can only *request* a promotion; an admin approves it. */
  approval: PromotionApproval;
  requestedBy?: string;
  createdAt: string;
}

export type ServiceOrderStatus = "pending" | "scheduled" | "in_progress" | "completed" | "cancelled";
/** Stripe isn't connected yet, so new orders wait for payment; the webhook will set "paid". */
export type ServicePaymentStatus = "awaiting_payment" | "paid" | "refunded" | "waived";

export interface ServiceOrder {
  id: string;
  serviceId: string;
  serviceName: string;
  buyerId: string;
  buyerName: string;
  businessId?: string;
  planId?: string;
  listPrice: number;
  discount: number;
  total: number;
  promotionId?: string;
  promotionLabel?: string;
  couponCode?: string;
  paymentStatus: ServicePaymentStatus;
  status: ServiceOrderStatus;
  assignedTo?: string; // staff AppUser.id
  scheduledFor?: string; // ISO date
  notes: string;
  createdAt: string; // ISO datetime
  updatedAt: string;
}
