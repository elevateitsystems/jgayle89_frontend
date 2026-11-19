"use client";

import { useMemo, useState } from "react";
import { Check, FileEdit, MessageSquare, Pencil, Percent, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AnalyticsView } from "./analytics-view";
import { BusinessPicker, NoBusinesses, useSelectedBusiness } from "./business-picker";
import { EditRequestForm, type EditSection } from "./edit-request-form";
import { HiringToggle } from "./hiring-toggle";
import { useEditCaps } from "./owner-edit-requests";
import { SocialLinksList } from "./social-links";
import { PageHeader } from "@/components/admin/page-header";
import { BillingHistory } from "@/components/membership/billing-history";
import { UpgradePrompt, UsageMeter } from "@/components/membership/feature-access";
import { MembershipManager } from "@/components/membership/membership-manager";
import { Panel } from "@/components/dashboard/panel";
import { EditStatusPill, StatusPill } from "@/components/dashboard/status-pill";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnedBusinesses, useOwnerEditRequests } from "@/features/business/hooks";
import { cheapestPlanWith, limitOf } from "@/features/membership/access";
import { useBusinessOffers } from "@/features/offers/hooks";
import { OFFER_AUDIENCE_LABEL, awaitingFrom, countsAgainstAllowance, requiredApprovals } from "@/features/offers/rules";
import { OfferFormSheet, approvalNoteFor } from "@/components/offers/offer-form";
import { OfferStatusPill } from "@/components/offers/offer-ui";
import { RejectOfferDialog } from "@/components/offers/reject-offer-dialog";
import { useSiteSettings } from "@/hooks/use-settings";
import { offerService } from "@/services/offer-service";
import { useAllPlans, useBusinessPlans, useInvoices, useResolvedPlan } from "@/features/membership/hooks";
import { useSession } from "@/hooks/use-session";
import { formatDate, todayISO } from "@/lib/date";
import type { Business, BusinessOffer } from "@/types";

/** Shared scaffolding: loads the owner's businesses, shows the picker, and renders `children` for the selected one. */
export function ForSelectedBusiness({ pickerLabel, children }: { pickerLabel?: string; children: (b: Business) => React.ReactNode }) {
  const user = useSession();
  const { businesses, loading } = useOwnedBusinesses(user?.id);
  const { selected, setId } = useSelectedBusiness(businesses);
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (businesses.length === 0) return <NoBusinesses />;
  return (
    <>
      <BusinessPicker businesses={businesses} value={selected?.id} onChange={setId} label={pickerLabel} />
      {selected && children(selected)}
    </>
  );
}

export function AnalyticsPage() {
  return (
    <>
      <PageHeader title="Business analytics" description="Profile views and clicks. Which insights you see depends on each business's plan." />
      <ForSelectedBusiness>{(b) => <AnalyticsView key={b.id} business={b} />}</ForSelectedBusiness>
    </>
  );
}

export function HiringPage() {
  const user = useSession();
  const { businesses, loading } = useOwnedBusinesses(user?.id);
  return (
    <>
      <PageHeader title="Hiring status" description="Tell veterans you're hiring. This is the one listing change that goes live immediately — it shows on your profile and directory card." />
      {loading ? <Skeleton className="h-48" /> : businesses.length === 0 ? <NoBusinesses /> : (
        <Panel title="Your businesses">
          <ul className="divide-y divide-sand-200">
            {businesses.map((b) => <li key={b.id} className="py-4 first:pt-0 last:pb-0"><HiringToggle business={b} /></li>)}
          </ul>
        </Panel>
      )}
    </>
  );
}

/** Pending request for a business that touches the given field, if any. */
function usePendingFor(userId: string | undefined, businessId: string, field: "socialLinks" | "promotions") {
  const requests = useOwnerEditRequests(userId);
  return requests.find((r) => r.businessId === businessId && r.status === "pending" && field in r.changes);
}

function RequestBanner({ field, businessId }: { field: "socialLinks" | "promotions"; businessId: string }) {
  const user = useSession();
  const pending = usePendingFor(user?.id, businessId, field);
  if (!pending) return null;
  return (
    <p role="status" className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-brass/40 bg-brass-soft px-3 py-2.5 text-sm text-sand-700">
      <EditStatusPill status="pending" /> A request to change this was submitted {formatDate(pending.createdAt)}. Your public profile updates once staff approve it.
    </p>
  );
}

function SectionEditor({ business, sections, label }: { business: Business; sections: EditSection[]; label: string }) {
  const [open, setOpen] = useState(false);
  const caps = useEditCaps(business.id);
  return (
    <>
      <Button onClick={() => setOpen(true)}><FileEdit /> {label}</Button>
      <EditRequestForm open={open} onOpenChange={setOpen} business={business} sections={sections} caps={caps} />
    </>
  );
}

export function SocialLinksPage() {
  return (
    <>
      <PageHeader title="Social media links" description="Facebook, Instagram, LinkedIn, YouTube and other websites shown on your public profile. Changes are reviewed by staff." />
      <ForSelectedBusiness>
        {(b) => <SocialLinksPanel key={b.id} business={b} />}
      </ForSelectedBusiness>
    </>
  );
}

function SocialLinksPanel({ business }: { business: Business }) {
  const plan = useResolvedPlan("business", business.id);
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Panel title={`Links on ${business.name}`} className="lg:col-span-2" action={<SectionEditor business={business} sections={["social"]} label="Request changes" />}>
        <RequestBanner field="socialLinks" businessId={business.id} />
        <SocialLinksList links={business.socialLinks ?? []} />
      </Panel>
      <Panel title="Plan allowance">
        <UsageMeter plan={plan} featureId="social_links" used={(business.socialLinks ?? []).length} label="Social links" />
      </Panel>
    </div>
  );
}

export function PromotionsPage() {
  return (
    <>
      <PageHeader title="Discounts & promotions" description="Veteran and first-responder offers shown on your public profile. Offers are approved before they go public; temporary deals show a countdown." />
      <ForSelectedBusiness>{(b) => <PromotionsPanel key={b.id} business={b} />}</ForSelectedBusiness>
    </>
  );
}

/**
 * Owner offers (client update §4C). Owners submit and update their own offers; the approval rule in Admin → Settings
 * decides whether staff, the owner, or both must approve before anything is public.
 */
function PromotionsPanel({ business }: { business: Business }) {
  const user = useSession();
  const plan = useResolvedPlan("business", business.id);
  const plans = useAllPlans();
  const settings = useSiteSettings();
  const offers = useBusinessOffers(business.id);
  const [editing, setEditing] = useState<BusinessOffer | "new" | null>(null);
  const [rejecting, setRejecting] = useState<BusinessOffer | null>(null);
  const limit = limitOf(plan, "promotions");
  const locked = limit === 0;
  const needs = cheapestPlanWith(plans, "business", "promotions");
  const today = todayISO();
  const used = offers.filter((o) => countsAgainstAllowance(o, today)).length;
  const ownerRequires = requiredApprovals(settings.offerApproval.ownerSubmitted, "owner");
  const sorted = [...offers].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  async function run(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast.success(ok); } catch (e) { toast.error("Couldn't update the offer", { description: e instanceof Error ? e.message : undefined }); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {locked && <UpgradePrompt featureLabel="Discounts & promotions" requiredPlan={needs?.name} href="/dashboard/memberships" />}
        <Panel title={`Offers on ${business.name}`} action={!locked && user && <Button size="sm" onClick={() => setEditing("new")}><Plus /> New offer</Button>}>
          {sorted.length === 0 ? (
            <EmptyState icon={Percent} title="No offers yet" description={locked ? "Upgrade to add a discount." : "Add a discount for veterans or first responders."} className="border-0 bg-transparent py-8" />
          ) : (
            <ul className="space-y-3">
              {sorted.map((o) => {
                const waiting = awaitingFrom(o);
                return (
                  <li key={o.id} className="rounded-md border bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone="good">{o.discountText}</StatusPill>
                      <OfferStatusPill offer={o} />
                      <span className="text-xs text-muted-foreground">{OFFER_AUDIENCE_LABEL[o.audience]}{o.expiresOn ? ` · until ${formatDate(o.expiresOn)}` : ""}</span>
                    </div>
                    <p className="mt-2 font-semibold text-olive-950">{o.title}</p>
                    {o.description && <p className="text-sm text-muted-foreground">{o.description}</p>}
                    {waiting.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {waiting.includes("owner") ? `Created by ${o.createdByName} (staff) — waiting for your approval.` : "Waiting for Mission: SITREP staff to approve."}
                      </p>
                    )}
                    {o.status === "rejected" && (
                      <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                        <p><span className="font-semibold text-destructive">Rejected.</span> {o.rejectionReason}</p>
                        {o.talkRequested ? (
                          <p className="mt-2 text-xs text-muted-foreground">You asked to speak with staff — we&apos;ll be in touch. (Demo: no message is sent.)</p>
                        ) : (
                          <Button size="sm" variant="outline" className="mt-2" onClick={() => user && run(() => offerService.requestTalk(o.id, user), "Request sent to staff")}>
                            <MessageSquare /> Request to speak with staff
                          </Button>
                        )}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {waiting.includes("owner") && user && (
                        <>
                          <Button size="sm" onClick={() => run(() => offerService.approve(o.id, "owner", user), "Offer approved")}><Check /> Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => setRejecting(o)}><X /> Reject</Button>
                        </>
                      )}
                      {o.status !== "inactive" && !locked && <Button size="sm" variant="ghost" onClick={() => setEditing(o)}><Pencil /> Update</Button>}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
      <div className="space-y-6">
        <Panel title="Plan allowance"><UsageMeter plan={plan} featureId="promotions" used={used} label="Active offers" /></Panel>
        <Panel title="How approval works">
          <p className="text-sm text-muted-foreground">{approvalNoteFor(ownerRequires)} Updating a live offer sends the new version for approval again.</p>
        </Panel>
      </div>
      <OfferFormSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        offer={editing && editing !== "new" ? editing : null}
        approvalNote={approvalNoteFor(ownerRequires)}
        onSubmit={async (input) => {
          if (!user) return;
          try {
            if (editing === "new") await offerService.submitByOwner(business.id, input, user, limit);
            else if (editing) await offerService.update(editing.id, input, user, "owner");
            toast.success("Offer submitted", { description: approvalNoteFor(ownerRequires) });
            setEditing(null);
          } catch (e) {
            toast.error("Couldn't submit the offer", { description: e instanceof Error ? e.message : undefined });
          }
        }}
      />
      <RejectOfferDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title={rejecting?.title ?? ""}
        side="owner"
        onReject={async (reason) => { if (rejecting && user) await run(() => offerService.reject(rejecting.id, "owner", user, reason), "Offer rejected"); }}
      />
    </div>
  );
}

export function BusinessMembershipsPage() {
  const user = useSession();
  const { businesses, loading } = useOwnedBusinesses(user?.id);
  const plans = useBusinessPlans(businesses.map((b) => b.id));
  const { selected, setId } = useSelectedBusiness(businesses);
  const summary = useMemo(() => businesses.map((b) => ({ b, plan: plans.get(b.id) })), [businesses, plans]);
  return (
    <>
      <PageHeader title="Business memberships" description="Each business has its own plan. Paid plans include the “Verified Business” badge; other verification badges are earned through staff review. Advertising is bought separately." />
      {loading ? <Skeleton className="h-64" /> : !user || businesses.length === 0 ? <NoBusinesses /> : (
        <div className="space-y-8">
          {businesses.length > 1 && (
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Plan for each business">
              {summary.map(({ b, plan }) => (
                <li key={b.id}>
                  <button type="button" onClick={() => setId(b.id)} aria-pressed={selected?.id === b.id} className={`w-full rounded-lg border bg-card p-4 text-left shadow-card transition-colors hover:border-olive-300 ${selected?.id === b.id ? "border-olive-600 ring-1 ring-olive-600" : ""}`}>
                    <p className="truncate font-semibold text-olive-950">{b.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{plan?.name ?? "Free"} plan</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selected && <MembershipManager key={selected.id} mode="manage" audience="business" subjectId={selected.id} subjectLabel={selected.name} user={user} />}
        </div>
      )}
    </>
  );
}

export function PaymentHistoryPage() {
  const user = useSession();
  const invoices = useInvoices();
  const mine = useMemo(() => invoices.filter((i) => i.userId === user?.id), [invoices, user?.id]);
  const spent = mine.filter((i) => i.status === "paid").reduce((n, i) => n + i.amount, 0);
  const membership = mine.filter((i) => i.status === "paid" && i.kind === "membership").reduce((n, i) => n + i.amount, 0);
  const money = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  return (
    <>
      <PageHeader title="Payment history" description="Every charge on your account. Membership subscriptions and advertising purchases are billed separately." />
      <dl className="mb-6 grid gap-3 sm:grid-cols-3">
        {[["Total paid", money(spent)], ["Memberships", money(membership)], ["Advertising", money(spent - membership)]].map(([k, v]) => (
          <div key={k} className="rounded-lg border bg-card p-4 shadow-card"><dt className="text-xs font-medium text-muted-foreground">{k}</dt><dd className="mt-1 font-heading text-3xl font-semibold tabular-nums text-olive-950">{v}</dd></div>
        ))}
      </dl>
      <BillingHistory invoices={mine} showKind />
    </>
  );
}
