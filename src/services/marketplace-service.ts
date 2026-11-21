import { createCollectionStore, delay } from "@/lib/demo-store";
import { todayISO } from "@/lib/date";
import { serviceOrders as seedOrders, servicePromotions as seedPromotions, services as seedServices } from "@/lib/mock-data/services";
import { newId } from "@/lib/slug";
import { hasPermission } from "@/lib/permissions";
import { describePromotion, purchaseBlock, quote } from "@/features/services/pricing";
import { requirePermission, type Requester, type Reviewer } from "@/services/actor";
import { auditService } from "@/services/audit-service";
import { createCheckoutSession, type CheckoutResult } from "@/services/payments-service";
import type { ServiceListing, ServiceOrder, ServiceOrderStatus, ServicePromotion } from "@/types";

/**
 * Additional Services Marketplace (demo implementation). The API must re-check eligibility, promotions and
 * permissions on every call; payment status may only change from the Stripe webhook.
 */
export const serviceStore = createCollectionStore<ServiceListing>("services", seedServices);
export const promotionStore = createCollectionStore<ServicePromotion>("service-promotions", seedPromotions);
export const orderStore = createCollectionStore<ServiceOrder>("service-orders", seedOrders);

export type ServiceInput = Omit<ServiceListing, "id" | "createdAt" | "sortOrder">;
export type PromotionInput = Omit<ServicePromotion, "id" | "createdAt" | "approval" | "requestedBy">;

const nowIso = () => new Date().toISOString();

export const marketplaceService = {
  // ---- Catalogue (Admin / staff with "Manage services & orders")
  async createService(input: ServiceInput, staff: Reviewer): Promise<ServiceListing> {
    await delay(400);
    requirePermission(staff, "services.manage", "create services");
    const all = serviceStore.getSnapshot();
    const s: ServiceListing = { ...input, id: newId("svc"), sortOrder: Math.max(0, ...all.map((x) => x.sortOrder)) + 10, createdAt: todayISO() };
    serviceStore.set([...all, s]);
    auditService.record(staff, "services", "created service", { id: s.id, name: s.name });
    return s;
  },

  async updateService(id: string, patch: Partial<ServiceInput>, staff: Reviewer): Promise<void> {
    await delay(350);
    requirePermission(staff, "services.manage", "edit services");
    const all = serviceStore.getSnapshot();
    const current = all.find((s) => s.id === id);
    if (!current) throw new Error("Service not found.");
    serviceStore.set(all.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const action = patch.availability && patch.availability !== current.availability
      ? (patch.availability === "coming_soon" ? "marked Coming Soon" : patch.availability === "active" ? "activated service" : "deactivated service")
      : patch.price !== undefined && patch.price !== current.price ? "changed price" : "edited service";
    auditService.record(staff, "services", action, { id, name: current.name }, patch.price !== undefined && patch.price !== current.price ? `$${current.price} → $${patch.price}` : undefined);
  },

  async removeService(id: string, staff: Reviewer): Promise<void> {
    await delay(300);
    requirePermission(staff, "services.manage", "delete services");
    const current = serviceStore.getSnapshot().find((s) => s.id === id);
    if (!current) throw new Error("Service not found.");
    serviceStore.set(serviceStore.getSnapshot().filter((s) => s.id !== id));
    auditService.record(staff, "services", "deleted service", { id, name: current.name });
  },

  // ---- Promotions
  /**
   * Admins and staff with "Apply service discounts" create promotions directly. Other service staff can only
   * *request* one — it stays pending (and never applies) until someone with the permission approves it.
   */
  async createPromotion(input: PromotionInput, staff: Reviewer): Promise<ServicePromotion> {
    await delay(400);
    const direct = hasPermission(staff, "services.discounts");
    if (!direct) requirePermission(staff, "services.manage", "request discounts");
    const p: ServicePromotion = {
      ...input,
      couponCode: input.couponCode.trim().toUpperCase(),
      id: newId("promo"),
      approval: direct ? "approved" : "pending",
      ...(direct ? {} : { requestedBy: staff.name }),
      createdAt: todayISO(),
    };
    if (p.couponCode && promotionStore.getSnapshot().some((x) => x.couponCode === p.couponCode)) throw new Error(`Coupon code ${p.couponCode} is already in use.`);
    promotionStore.set([p, ...promotionStore.getSnapshot()]);
    auditService.record(staff, "promotions", direct ? "created promotion" : "requested discount", { id: p.id, name: p.name }, describePromotion(p));
    return p;
  },

  async reviewPromotion(id: string, approve: boolean, staff: Reviewer): Promise<void> {
    await delay(300);
    requirePermission(staff, "services.discounts", "approve discounts");
    const all = promotionStore.getSnapshot();
    const p = all.find((x) => x.id === id);
    if (!p || p.approval !== "pending") throw new Error("Nothing to review.");
    promotionStore.set(all.map((x) => (x.id === id ? { ...x, approval: approve ? "approved" : "rejected" } : x)));
    auditService.record(staff, "promotions", approve ? "approved discount request" : "rejected discount request", { id, name: p.name });
  },

  async setPromotionActive(id: string, active: boolean, staff: Reviewer): Promise<void> {
    await delay(250);
    requirePermission(staff, "services.discounts", "change promotions");
    const p = promotionStore.getSnapshot().find((x) => x.id === id);
    promotionStore.set(promotionStore.getSnapshot().map((x) => (x.id === id ? { ...x, active } : x)));
    auditService.record(staff, "promotions", active ? "activated promotion" : "deactivated promotion", { id, name: p?.name ?? id });
  },

  // ---- Purchases
  /**
   * Creates the purchase record staff manage (status Pending, payment "awaiting payment"), then hands off to
   * Stripe Checkout. Stripe isn't connected yet, so the order stays unpaid and the result says so.
   */
  async purchase(serviceId: string, buyer: Requester, ctx: { planId?: string; businessId?: string; coupon?: string; notes?: string }): Promise<{ order: ServiceOrder; checkout: CheckoutResult }> {
    await delay(500);
    const service = serviceStore.getSnapshot().find((s) => s.id === serviceId);
    if (!service) throw new Error("Service not found.");
    const block = purchaseBlock(service, ctx.planId);
    if (block === "coming_soon") throw new Error("This service is coming soon and can't be purchased yet.");
    if (block === "inactive") throw new Error("This service isn't available right now.");
    if (block === "not_eligible") throw new Error("This service isn't included for your membership tier.");
    const q = quote(service, promotionStore.getSnapshot(), { planId: ctx.planId, today: todayISO(), coupon: ctx.coupon });
    if (q.couponRejected && !q.promotion) throw new Error("That coupon code isn't valid for this service.");
    const at = nowIso();
    const order: ServiceOrder = {
      id: newId("ord"), serviceId, serviceName: service.name, buyerId: buyer.id, buyerName: buyer.name, businessId: ctx.businessId, planId: ctx.planId,
      listPrice: q.listPrice, discount: q.discount, total: q.total, promotionId: q.promotion?.id, promotionLabel: q.promotion ? describePromotion(q.promotion) : undefined,
      couponCode: q.promotion?.couponCode || undefined, paymentStatus: q.total === 0 ? "waived" : "awaiting_payment", status: "pending",
      notes: ctx.notes?.trim() ?? "", createdAt: at, updatedAt: at,
    };
    orderStore.set([order, ...orderStore.getSnapshot()]);
    const checkout: CheckoutResult = q.total === 0
      ? { status: "not_configured", message: "No payment is due — your request has been sent to our team." }
      : await createCheckoutSession({ kind: "service", description: service.name, amountUsd: q.total, metadata: { orderId: order.id, serviceId } });
    return { order, checkout };
  },

  async updateOrder(id: string, patch: { status?: ServiceOrderStatus; assignedTo?: string; scheduledFor?: string; notes?: string }, staff: Reviewer): Promise<void> {
    await delay(300);
    requirePermission(staff, "services.manage", "update service orders");
    const all = orderStore.getSnapshot();
    const current = all.find((o) => o.id === id);
    if (!current) throw new Error("Order not found.");
    orderStore.set(all.map((o) => (o.id === id ? { ...o, ...patch, updatedAt: nowIso() } : o)));
    if (patch.status && patch.status !== current.status) auditService.record(staff, "orders", `marked ${patch.status.replace("_", " ")}`, { id, name: `${current.serviceName} · ${current.buyerName}` });
  },

  reset() {
    serviceStore.reset();
    promotionStore.reset();
    orderStore.reset();
  },
};
