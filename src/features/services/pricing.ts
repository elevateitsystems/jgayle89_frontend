/**
 * Services Marketplace rules (client update §6). Pure. The API must re-run these on checkout — the browser
 * only shows a quote; it never decides what is charged.
 */
import type { PromotionKind, ServiceListing, ServicePromotion } from "../../types/index.ts";

export const PROMOTION_KIND_LABEL: Record<PromotionKind, string> = {
  percent_off: "Percent off",
  amount_off: "Dollar amount off",
  free_months: "Months free",
  free_consultation: "Free consultation",
  member_price: "Member-exclusive price",
};

export type PurchaseBlock = "coming_soon" | "inactive" | "not_eligible" | null;

/** Why a service can't be bought right now (null = it can). Free plans can buy whatever lists them as eligible. */
export function purchaseBlock(service: Pick<ServiceListing, "availability" | "eligiblePlanIds">, planId: string | undefined): PurchaseBlock {
  if (service.availability === "coming_soon") return "coming_soon";
  if (service.availability === "inactive") return "inactive";
  if (!planId || !service.eligiblePlanIds.includes(planId)) return "not_eligible";
  return null;
}

/** Does a promotion apply to this service, plan and date? Coupon promotions also need the matching code. */
export function promotionApplies(p: ServicePromotion, ctx: { serviceId: string; planId?: string; today: string; coupon?: string }): boolean {
  if (!p.active || p.approval !== "approved") return false;
  if (p.startsOn > ctx.today || (p.endsOn && p.endsOn < ctx.today)) return false;
  if (p.serviceIds.length > 0 && !p.serviceIds.includes(ctx.serviceId)) return false;
  if (p.planIds.length > 0 && (!ctx.planId || !p.planIds.includes(ctx.planId))) return false;
  if (p.couponCode) return !!ctx.coupon && ctx.coupon.trim().toUpperCase() === p.couponCode.toUpperCase();
  return true;
}

/** Dollar discount a promotion gives on a price (never more than the price). */
export function discountFor(p: Pick<ServicePromotion, "kind" | "value">, service: Pick<ServiceListing, "price" | "priceUnit">): number {
  const price = service.price;
  let d = 0;
  switch (p.kind) {
    case "percent_off":
      d = (price * p.value) / 100;
      break;
    case "amount_off":
      d = p.value;
      break;
    case "free_consultation":
      d = price;
      break;
    // "One month free" — the first month of a monthly service.
    case "free_months":
      d = /month/i.test(service.priceUnit) ? price * Math.max(0, Math.min(1, p.value)) : 0;
      break;
    case "member_price":
      d = price - p.value;
      break;
  }
  return Math.round(Math.max(0, Math.min(price, d)) * 100) / 100;
}

export interface Quote {
  listPrice: number;
  discount: number;
  total: number;
  promotion?: ServicePromotion;
  /** True when a coupon was entered but doesn't apply. */
  couponRejected: boolean;
}

/** The best single promotion (promotions don't stack). An entered coupon competes with automatic offers. */
export function quote(service: ServiceListing, promotions: ServicePromotion[], ctx: { planId?: string; today: string; coupon?: string }): Quote {
  const base = { serviceId: service.id, planId: ctx.planId, today: ctx.today };
  const auto = promotions.filter((p) => !p.couponCode && promotionApplies(p, base));
  const entered = ctx.coupon?.trim() ?? "";
  const coupon = entered ? promotions.filter((p) => p.couponCode && promotionApplies(p, { ...base, coupon: entered })) : [];
  let best: ServicePromotion | undefined;
  let bestD = 0;
  for (const p of [...auto, ...coupon]) {
    const d = discountFor(p, service);
    if (d > bestD) {
      best = p;
      bestD = d;
    }
  }
  return {
    listPrice: service.price,
    discount: bestD,
    total: Math.round((service.price - bestD) * 100) / 100,
    promotion: best,
    couponRejected: !!entered && coupon.length === 0,
  };
}

const usd = (n: number) => "$" + (Number.isInteger(n) ? String(n) : n.toFixed(2));

export function describePromotion(p: Pick<ServicePromotion, "kind" | "value">): string {
  switch (p.kind) {
    case "percent_off":
      return `${p.value}% off`;
    case "amount_off":
      return `${usd(p.value)} off`;
    case "free_months":
      return p.value === 1 ? "One month free" : `${p.value} months free`;
    case "free_consultation":
      return "Free consultation";
    case "member_price":
      return `Member price ${usd(p.value)}`;
  }
}
