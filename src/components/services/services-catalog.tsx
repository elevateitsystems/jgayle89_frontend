"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Check, Clock, CreditCard, Info, Loader2, Lock, ShoppingBag, Tag } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { BusinessPicker, NoBusinesses, useSelectedBusiness } from "@/components/business/business-picker";
import { Panel } from "@/components/dashboard/panel";
import { StatusPill, type Tone } from "@/components/dashboard/status-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useOwnedBusinesses } from "@/features/business/hooks";
import { formatPrice } from "@/features/membership/access";
import { useAllPlans, useResolvedPlan } from "@/features/membership/hooks";
import { describePromotion, purchaseBlock, quote } from "@/features/services/pricing";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { formatDate, todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import { marketplaceService, orderStore, promotionStore, serviceStore } from "@/services/marketplace-service";
import type { Business, MembershipPlan, ServiceListing, ServiceOrderStatus, ServicePaymentStatus } from "@/types";

export const ORDER_STATUS: Record<ServiceOrderStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pending", tone: "warn" },
  scheduled: { label: "Scheduled", tone: "info" },
  in_progress: { label: "In Progress", tone: "info" },
  completed: { label: "Completed", tone: "good" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};
export const PAYMENT_STATUS: Record<ServicePaymentStatus, { label: string; tone: Tone }> = {
  awaiting_payment: { label: "Awaiting payment", tone: "warn" },
  paid: { label: "Paid", tone: "good" },
  refunded: { label: "Refunded", tone: "neutral" },
  waived: { label: "No charge", tone: "good" },
};

/** Veteran / Civilian members (any plan, including Free) → Services. */
export function MemberServicesPage() {
  const user = useSession();
  const audience = user?.userType === "civilian" ? "civilian" : "veteran";
  const plan = useResolvedPlan(audience, user?.id);
  if (!user) return null;
  return (
    <>
      <PageHeader title="Services" description="Professional help that isn't part of your membership — available on every plan, with savings for paid members." />
      <Catalog audience="member" plan={plan} />
    </>
  );
}

/** Business owners (any business plan, including Free) → Business Services. Prices follow the selected business's plan. */
export function BusinessServicesPage() {
  const user = useSession();
  const { businesses, loading } = useOwnedBusinesses(user?.id);
  const { selected, setId } = useSelectedBusiness(businesses);
  return (
    <>
      <PageHeader title="Business services" description="Consulting, marketing and growth services for your business — available on every business plan." />
      {loading ? <Skeleton className="h-64" /> : !selected ? <NoBusinesses /> : (
        <>
          <BusinessPicker businesses={businesses} value={selected.id} onChange={setId} label="Buying for" />
          <BusinessCatalog key={selected.id} business={selected} />
        </>
      )}
    </>
  );
}

function BusinessCatalog({ business }: { business: Business }) {
  const plan = useResolvedPlan("business", business.id);
  return <Catalog audience="business" plan={plan} business={business} />;
}

function Catalog({ audience, plan, business }: { audience: "member" | "business"; plan: MembershipPlan | undefined; business?: Business }) {
  const user = useSession();
  const services = useStore(serviceStore);
  const promotions = useStore(promotionStore);
  const orders = useStore(orderStore);
  const plans = useAllPlans();
  const [buying, setBuying] = useState<ServiceListing | null>(null);
  const today = todayISO();

  const list = useMemo(
    () => services.filter((s) => s.audience === audience && s.availability !== "inactive").sort((a, b) => a.sortOrder - b.sortOrder),
    [services, audience],
  );
  const mine = useMemo(
    () => orders.filter((o) => o.buyerId === user?.id && (audience === "business" ? o.businessId === business?.id : !o.businessId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders, user?.id, audience, business?.id],
  );
  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id;

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        {list.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="No services yet" description="New services will appear here." />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {list.map((s) => {
              const block = purchaseBlock(s, plan?.id);
              const q = quote(s, promotions, { planId: plan?.id, today });
              const eligibleNames = [...new Set(s.eligiblePlanIds.map(planName))];
              return (
                <li key={s.id} className="flex flex-col overflow-hidden rounded-lg border bg-card shadow-card">
                  {s.image && (
                    <span className="relative block aspect-[16/7] bg-sand-200">
                      <Image src={s.image} alt="" fill sizes="(min-width: 1280px) 420px, (min-width: 768px) 45vw, 100vw" className="object-cover" unoptimized={s.image.startsWith("data:")} />
                    </span>
                  )}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {s.availability === "coming_soon" && <StatusPill tone="info"><Clock className="size-3" aria-hidden /> Coming Soon</StatusPill>}
                      {q.promotion && block === null && <StatusPill tone="good"><Tag className="size-3" aria-hidden /> {describePromotion(q.promotion)}</StatusPill>}
                    </div>
                    <h2 className="mt-2 font-sans text-lg font-semibold text-olive-950">{s.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{s.shortDescription}</p>
                    <p className="mt-3 flex items-baseline gap-2">
                      <span className="font-heading text-2xl font-semibold text-olive-950">{formatPrice(block === null ? q.total : s.price)}</span>
                      {block === null && q.discount > 0 && <span className="text-sm text-muted-foreground line-through">{formatPrice(s.price)}</span>}
                      <span className="text-xs text-muted-foreground">{s.priceUnit}</span>
                    </p>
                    <details className="mt-3 text-sm">
                      <summary className="cursor-pointer font-semibold text-olive-700">Details &amp; what&apos;s included</summary>
                      <p className="mt-2 text-foreground/80">{s.description}</p>
                      <ul className="mt-2 space-y-1">
                        {s.included.map((i) => <li key={i} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-olive-600" aria-hidden />{i}</li>)}
                      </ul>
                      <p className="mt-2 text-xs text-muted-foreground">Eligible tiers: {eligibleNames.join(", ")}</p>
                    </details>
                    <div className="mt-auto pt-4">
                      {block === "coming_soon" ? (
                        <Button disabled className="w-full"><Clock /> Coming Soon</Button>
                      ) : block === "not_eligible" ? (
                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Lock className="size-4" aria-hidden /> Not included for the {plan?.name ?? "current"} tier.</p>
                      ) : (
                        <Button className="w-full" onClick={() => setBuying(s)}><ShoppingBag /> {/session/i.test(s.priceUnit) ? "Book" : "Purchase"}</Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Panel title="My purchases" subtitle="Our team updates the status as they work on it">
        {mine.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No purchases yet.</p>
        ) : (
          <ul className="divide-y divide-sand-200">
            {mine.map((o) => (
              <li key={o.id} className="py-3 first:pt-0 last:pb-0">
                <p className="font-semibold text-olive-950">{o.serviceName}</p>
                <p className="text-xs text-muted-foreground">{formatDate(o.createdAt.slice(0, 10))} · {formatPrice(o.total)}{o.promotionLabel ? ` · ${o.promotionLabel}` : ""}</p>
                <p className="mt-1.5 flex flex-wrap gap-1.5">
                  <StatusPill tone={ORDER_STATUS[o.status].tone}>{ORDER_STATUS[o.status].label}</StatusPill>
                  <StatusPill tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</StatusPill>
                </p>
                {o.scheduledFor && o.status === "scheduled" && <p className="mt-1 text-xs text-muted-foreground">Scheduled for {formatDate(o.scheduledFor)}</p>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <CheckoutSheet service={buying} plan={plan} business={business} onClose={() => setBuying(null)} />
    </div>
  );
}

function CheckoutSheet({ service, plan, business, onClose }: { service: ServiceListing | null; plan: MembershipPlan | undefined; business?: Business; onClose: () => void }) {
  return (
    <Dialog open={!!service} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {service && <CheckoutBody key={service.id} service={service} plan={plan} business={business} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function CheckoutBody({ service, plan, business, onClose }: { service: ServiceListing; plan: MembershipPlan | undefined; business?: Business; onClose: () => void }) {
  const user = useSession();
  const promotions = useStore(promotionStore);
  const [coupon, setCoupon] = useState("");
  const [applied, setApplied] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const q = quote(service, promotions, { planId: plan?.id, today: todayISO(), coupon: applied });

  async function proceed() {
    if (!user) return;
    setBusy(true);
    try {
      const { checkout } = await marketplaceService.purchase(service.id, user, { planId: plan?.id, businessId: business?.id, coupon: applied, notes });
      if (checkout.status === "redirect") return window.location.assign(checkout.url);
      toast.success("Request recorded", { description: "Our team can see it in Service Orders." });
      setMessage(checkout.message);
    } catch (e) {
      toast.error("Couldn't complete the purchase", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{service.name}</DialogTitle>
        <DialogDescription>{business ? `For ${business.name} · ` : ""}{plan?.name ?? "Free"} plan pricing</DialogDescription>
      </DialogHeader>
      {message ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-sm text-sand-700"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {message}</p>
          <p className="text-sm text-muted-foreground">Your purchase is listed under “My purchases” as Pending. A team member will follow up.</p>
          <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
        </div>
      ) : (
        <>
          <dl className="space-y-2 rounded-md border bg-white p-4 text-sm">
            <div className="flex justify-between"><dt>Price</dt><dd className="tabular-nums">{formatPrice(q.listPrice)} <span className="text-xs text-muted-foreground">{service.priceUnit}</span></dd></div>
            {q.promotion && <div className="flex justify-between text-olive-700"><dt>{describePromotion(q.promotion)}{q.promotion.couponCode ? ` (${q.promotion.couponCode})` : ""}</dt><dd className="tabular-nums">−{formatPrice(q.discount)}</dd></div>}
            <div className="flex justify-between border-t pt-2 font-semibold"><dt>Total today</dt><dd className="tabular-nums">{formatPrice(q.total)}</dd></div>
          </dl>
          <div className="flex items-end gap-2">
            <FormField label="Coupon code" htmlFor="co-code" className="flex-1" error={applied && q.couponRejected ? "That code isn't valid for this service." : undefined}>
              <Input id="co-code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="e.g. SALUTE25" />
            </FormField>
            <Button variant="outline" onClick={() => setApplied(coupon.trim())} disabled={!coupon.trim()}>Apply</Button>
          </div>
          <FormField label="Anything we should know?" htmlFor="co-notes" hint="Optional — e.g. preferred times.">
            <Textarea id="co-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
          <p className="flex items-start gap-2 text-xs text-muted-foreground"><Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Payment is handled by Stripe Checkout. In this preview Stripe isn&apos;t connected: your request is recorded and nothing is charged.</p>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button onClick={proceed} disabled={busy} className={cn(busy && "opacity-80")}>{busy ? <><Loader2 className="animate-spin" /> Processing…</> : <><CreditCard /> {q.total === 0 ? "Request service" : "Continue to checkout"}</>}</Button>
          </DialogFooter>
        </>
      )}
    </>
  );
}
