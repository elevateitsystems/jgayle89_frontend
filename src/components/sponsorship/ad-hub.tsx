"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CreditCard, Eye, Gift, MousePointerClick, Plus, Megaphone } from "lucide-react";
import { CampaignDetail } from "./campaign-detail";
import { PageHeader } from "@/components/admin/page-header";
import { NoBusinesses } from "@/components/business/business-picker";
import { CheckoutDialog } from "@/components/membership/checkout-dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatCard } from "@/components/dashboard/panel";
import { CampaignStatusPill, StatusPill } from "@/components/dashboard/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdProducts, useCampaigns, useCredits } from "@/features/advertising/hooks";
import { GROUP_LABEL, awaitingPayment, credits as creditRules, displayStatus, groupOf, slotsAvailableOn, type CampaignGroup } from "@/features/advertising/rules";
import { useOwnedBusinesses } from "@/features/business/hooks";
import { formatPrice } from "@/features/membership/access";
import { useBusinessPlans } from "@/features/membership/hooks";
import { useSession } from "@/hooks/use-session";
import { daysFromToday, formatDate, todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { CheckoutRequest } from "@/services/payments-service";
import type { AdCampaign, AdFamily, AdProduct } from "@/types";

const COPY: Record<AdFamily, { title: string; description: string; empty: string }> = {
  advertising: { title: "Advertisements", description: "Promote a listing in search results, categories, the homepage or a banner. Bought separately from your membership.", empty: "No advertising campaigns yet" },
  sponsorship: { title: "Sponsorships", description: "Sponsor a place, an event, a community resource or the newsletter and be recognised by the community.", empty: "No sponsorships yet" },
};

/** Owner → Advertisements / Sponsorships: browse the marketplace and track campaigns. */
export function AdHub({ family }: { family: AdFamily }) {
  const user = useSession();
  const { businesses, loading } = useOwnedBusinesses(user?.id);
  const products = useAdProducts();
  const campaigns = useCampaigns();
  const credits = useCredits();
  const planByBiz = useBusinessPlans(businesses.map((b) => b.id));
  const copy = COPY[family];
  const today = todayISO();

  const mine = useMemo(() => campaigns.filter((c) => c.ownerId === user?.id && products.find((p) => p.id === c.productId)?.family === family), [campaigns, products, user?.id, family]);
  const familyProducts = useMemo(() => products.filter((p) => p.family === family), [products, family]);
  const live = mine.filter((c) => displayStatus(c, today) === "active");
  const impressions = mine.reduce((n, c) => n + c.impressions, 0);
  const clicks = mine.reduce((n, c) => n + c.clicks, 0);
  const balance = businesses.reduce((n, b) => n + creditRules.balance(credits, b.id, today), 0);

  // Allowances included with the owner's plans, summed across their businesses, for this family's products.
  const allowances = useMemo(() => {
    const out = new Map<string, number>();
    for (const b of businesses) {
      const plan = planByBiz.get(b.id);
      for (const [pid, n] of Object.entries(plan?.adAllowances ?? {})) out.set(pid, (out.get(pid) ?? 0) + n);
    }
    return out;
  }, [businesses, planByBiz]);

  if (!loading && businesses.length === 0) return <><PageHeader title={copy.title} description={copy.description} /><NoBusinesses /></>;

  return (
    <>
      <PageHeader title={copy.title} description={copy.description} />

      <section aria-label="Campaign totals" className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active campaigns" value={live.length} icon={Megaphone} />
        <StatCard label="Impressions" value={impressions.toLocaleString()} icon={Eye} />
        <StatCard label="Clicks" value={clicks.toLocaleString()} hint={impressions ? `${((clicks / impressions) * 100).toFixed(1)}% click-through` : undefined} icon={MousePointerClick} />
        <StatCard label="Promotional credit" value={formatPrice(balance)} hint="Applied at checkout" icon={Gift} />
      </section>

      <Tabs defaultValue="marketplace">
        <TabsList className="mb-4 h-auto p-1">
          <TabsTrigger value="marketplace" className="h-9 px-4">Marketplace</TabsTrigger>
          <TabsTrigger value="campaigns" className="h-9 px-4">My campaigns ({mine.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {familyProducts.map((p) => (
              <li key={p.id}><ProductCard product={p} campaigns={campaigns} included={allowances.get(p.id) ?? 0} /></li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">Prices are per campaign. Every public placement is labelled “Sponsored” or “Advertisement”. Included placements from your membership plan are redeemed at checkout once billing is connected.</p>
        </TabsContent>

        <TabsContent value="campaigns"><MyCampaigns campaigns={mine} products={products} loading={loading} empty={copy.empty} /></TabsContent>
      </Tabs>
    </>
  );
}

function ProductCard({ product: p, campaigns, included }: { product: AdProduct; campaigns: AdCampaign[]; included: number }) {
  const from = Math.min(...p.durations.map((d) => d.price));
  const open = slotsAvailableOn(p, campaigns, daysFromToday(3), p.durations[0]?.days ?? 7);
  return (
    <article className={cn("flex h-full flex-col rounded-lg border bg-card p-5 shadow-card", !p.active && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="neutral">{p.label}</StatusPill>
        {included > 0 && <StatusPill tone="good">{included}/mo included in your plan</StatusPill>}
      </div>
      <h3 className="mt-3 font-sans text-lg font-semibold text-olive-950">{p.name}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{p.description}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Appears</dt><dd className="text-right">{p.placement}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Durations</dt><dd className="text-right">{p.durations.map((d) => `${d.days}d`).join(" · ")}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Availability</dt><dd className="text-right">{open > 0 ? `${open} of ${p.totalSlots} slots open` : "Sold out soon — join waitlist"}</dd></div>
      </dl>
      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <p><span className="text-xs text-muted-foreground">from</span> <span className="font-heading text-2xl font-semibold tabular-nums text-olive-950">{formatPrice(from)}</span></p>
        {p.active ? (
          <Link href={`/dashboard/campaigns/new?product=${p.id}`} className={buttonVariants({ size: "sm" })}><Plus /> Create campaign</Link>
        ) : (
          <Button size="sm" disabled>Unavailable</Button>
        )}
      </div>
    </article>
  );
}

const GROUPS: CampaignGroup[] = ["active", "pending", "completed", "expired", "rejected"];

function MyCampaigns({ campaigns, products, loading, empty }: { campaigns: AdCampaign[]; products: AdProduct[]; loading: boolean; empty: string }) {
  const [group, setGroup] = useState<"" | CampaignGroup>("");
  const [viewing, setViewing] = useState<AdCampaign | null>(null);
  const [checkout, setCheckout] = useState<CheckoutRequest | null>(null);
  const today = todayISO();
  const productOf = (c: AdCampaign) => products.find((p) => p.id === c.productId);
  const statusOf = (c: AdCampaign) => displayStatus(c, today);
  const rows = campaigns.filter((c) => !group || groupOf(displayStatus(c, today)) === group);

  function pay(c: AdCampaign) {
    const p = productOf(c);
    setViewing(null);
    setCheckout({ kind: "advertising", description: `${p?.name ?? "Campaign"} — ${c.name}`, amountUsd: c.price, creditUsd: c.creditApplied, metadata: { campaignId: c.id, productId: c.productId } });
  }

  const columns: Column<AdCampaign>[] = [
    {
      id: "name", header: "Campaign", sort: (c) => c.name,
      cell: (c) => (
        <button type="button" onClick={() => setViewing(c)} className="block max-w-[15rem] text-left">
          <span className="block truncate font-semibold text-olive-950 hover:text-olive-700">{c.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{productOf(c)?.name} · {c.businessName}</span>
        </button>
      ),
    },
    { id: "status", header: "Status", sort: (c) => statusOf(c), cell: (c) => <CampaignStatusPill status={statusOf(c)} /> },
    { id: "dates", header: "Runs", hideBelow: "md", sort: (c) => c.startDate ?? c.requestedStart, cell: (c) => <span className="whitespace-nowrap text-muted-foreground">{c.startDate && c.endDate ? `${formatDate(c.startDate, { month: "short", day: "numeric" })} – ${formatDate(c.endDate, { month: "short", day: "numeric" })}` : "Not scheduled"}</span> },
    { id: "impr", header: "Impressions", hideBelow: "lg", sort: (c) => c.impressions, cell: (c) => <span className="tabular-nums">{c.impressions.toLocaleString()}</span> },
    { id: "clicks", header: "Clicks", hideBelow: "lg", sort: (c) => c.clicks, cell: (c) => <span className="tabular-nums">{c.clicks.toLocaleString()}</span> },
    {
      id: "actions", header: "Actions", srOnlyHeader: true,
      cell: (c) => (
        <div className="flex justify-end gap-1.5">
          {awaitingPayment(c) && statusOf(c) !== "expired" && <Button size="sm" onClick={() => pay(c)}><CreditCard /> Pay</Button>}
          {c.status === "changes_requested" && statusOf(c) !== "expired" && <Link href={`/dashboard/campaigns/new?edit=${c.id}`} className={buttonVariants({ size: "sm" })}>Revise</Link>}
          <Button size="sm" variant="outline" onClick={() => setViewing(c)}>View</Button>
        </div>
      ),
    },
  ];

  const viewingProduct = viewing ? productOf(viewing) : undefined;

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(c) => c.id}
        label="Campaigns"
        loading={loading}
        defaultSort={{ id: "status", dir: "asc" }}
        search={{ placeholder: "Search campaigns", text: (c) => `${c.name} ${c.businessName} ${productOf(c)?.name ?? ""}` }}
        filters={
          <NativeSelect aria-label="Filter by status" value={group} onChange={(e) => setGroup(e.target.value as typeof group)} className="w-44">
            <option value="">All campaigns</option>
            {GROUPS.map((g) => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}
          </NativeSelect>
        }
        noMatches={{ onClear: () => setGroup("") }}
        empty={{ title: empty, description: "Browse the marketplace and create your first campaign." }}
      />

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
          {viewing && viewingProduct && (
            <>
              <DialogHeader><DialogTitle>{viewing.name}</DialogTitle><DialogDescription>Campaign details and performance.</DialogDescription></DialogHeader>
              <CampaignDetail campaign={viewing} product={viewingProduct} />
              <DialogFooter>
                {awaitingPayment(viewing) && statusOf(viewing) !== "expired" && <Button onClick={() => pay(viewing)}><CreditCard /> Pay with Stripe</Button>}
                {viewing.status === "changes_requested" && <Link href={`/dashboard/campaigns/new?edit=${viewing.id}`} className={buttonVariants()}>Revise &amp; resubmit</Link>}
                <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <CheckoutDialog open={!!checkout} onOpenChange={(o) => !o && setCheckout(null)} request={checkout} title="Pay for your campaign" />
    </>
  );
}

