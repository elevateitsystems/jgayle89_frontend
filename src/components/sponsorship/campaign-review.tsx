"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CampaignDetail } from "./campaign-detail";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { ReviewActions } from "@/components/dashboard/review-actions";
import { CampaignStatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAdProducts, useCampaigns } from "@/features/advertising/hooks";
import { GROUP_LABEL, displayStatus, groupOf, slotsAvailableOn, addDaysISO, type CampaignGroup } from "@/features/advertising/rules";
import { formatPrice } from "@/features/membership/access";
import { useSession } from "@/hooks/use-session";
import { daysFromToday, formatDate, todayISO } from "@/lib/date";
import { hasPermission } from "@/lib/permissions";
import { adService, reviewPermission } from "@/services/ad-service";
import type { AdCampaign, AdFamily } from "@/types";

const GROUPS: CampaignGroup[] = ["pending", "active", "completed", "expired", "rejected"];

interface Props {
  /** Limit to one family (Staff pages); omit for the Admin "all campaigns" view. */
  family?: AdFamily;
  title: string;
  description: string;
}

/** Staff / Admin campaign review: approve, reject, request changes, then schedule an approved campaign. */
export function CampaignReviewQueue({ family, title, description }: Props) {
  const user = useSession();
  const campaigns = useCampaigns();
  const products = useAdProducts();
  const [group, setGroup] = useState<"" | CampaignGroup>(family ? "pending" : "");
  const [openId, setOpenId] = useState<string | null>(null);
  const [start, setStart] = useState(daysFromToday(3));
  const [scheduling, setScheduling] = useState(false);
  const today = todayISO();

  const productOf = (c: AdCampaign) => products.find((p) => p.id === c.productId);
  const scoped = useMemo(() => campaigns.filter((c) => !family || productOf(c)?.family === family), [campaigns, products, family]); // eslint-disable-line react-hooks/exhaustive-deps
  const rows = useMemo(() => scoped.filter((c) => !group || groupOf(displayStatus(c, today)) === group), [scoped, group, today]);
  const open = campaigns.find((c) => c.id === openId) ?? null;
  const openProduct = open ? productOf(open) : undefined;
  const canReview = !!user && !!openProduct && hasPermission(user, reviewPermission(openProduct));
  const waiting = scoped.filter((c) => c.status === "pending_review").length;

  async function schedule() {
    if (!open || !user) return;
    setScheduling(true);
    try {
      await adService.schedule(open.id, start, user);
      toast.success("Campaign scheduled", { description: `Starts ${formatDate(start)}. It goes live once the advertiser has paid.` });
    } catch (e) {
      toast.error("Couldn't schedule", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setScheduling(false);
    }
  }

  const columns: Column<AdCampaign>[] = [
    {
      id: "name", header: "Campaign", sort: (c) => c.name,
      cell: (c) => (
        <button type="button" onClick={() => { setOpenId(c.id); setStart(c.requestedStart >= daysFromToday(0) ? c.requestedStart : daysFromToday(3)); }} className="block max-w-[15rem] text-left">
          <span className="block truncate font-semibold text-olive-950 hover:text-olive-700">{c.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{c.businessName}</span>
        </button>
      ),
    },
    { id: "product", header: "Product", hideBelow: "md", sort: (c) => productOf(c)?.name ?? "", cell: (c) => productOf(c)?.name ?? "—" },
    { id: "price", header: "Price", hideBelow: "lg", sort: (c) => c.price, cell: (c) => <span className="tabular-nums">{formatPrice(c.price)}</span> },
    { id: "start", header: "Requested start", hideBelow: "lg", sort: (c) => c.requestedStart, cell: (c) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(c.requestedStart)}</span> },
    { id: "status", header: "Status", sort: (c) => displayStatus(c, today), cell: (c) => <CampaignStatusPill status={displayStatus(c, today)} /> },
    { id: "act", header: "Review", srOnlyHeader: true, cell: (c) => <button type="button" onClick={() => { setOpenId(c.id); setStart(c.requestedStart >= daysFromToday(0) ? c.requestedStart : daysFromToday(3)); }} className="text-sm font-semibold text-olive-700 hover:underline">{c.status === "pending_review" ? "Review" : c.status === "approved" ? "Schedule" : "View"}</button> },
  ];

  const openAvail = open && openProduct ? slotsAvailableOn(openProduct, campaigns, start, open.durationDays) : 0;

  return (
    <>
      <PageHeader title={title} description={`${waiting} waiting for review. ${description}`} />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(c) => c.id}
        label="Campaigns"
        defaultSort={{ id: "start", dir: "asc" }}
        search={{ placeholder: "Search by campaign, business or product", text: (c) => `${c.name} ${c.businessName} ${productOf(c)?.name ?? ""}` }}
        filters={
          <NativeSelect aria-label="Filter by status" value={group} onChange={(e) => setGroup(e.target.value as typeof group)} className="w-44">
            <option value="">All campaigns</option>
            {GROUPS.map((g) => <option key={g} value={g}>{GROUP_LABEL[g]}</option>)}
          </NativeSelect>
        }
        noMatches={{ onClear: () => setGroup("") }}
        empty={{ title: "No campaigns yet", description: "Submissions from advertisers will appear here." }}
      />

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-2xl">
          {open && openProduct && (
            <>
              <SheetHeader className="border-b border-sand-200 p-5"><SheetTitle>{open.name}</SheetTitle><SheetDescription>Check the creative is accurate and appropriately labelled before approving.</SheetDescription></SheetHeader>
              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                <CampaignDetail campaign={open} product={openProduct} />

                {open.status === "pending_review" && (canReview && user ? (
                  <ReviewActions
                    idPrefix="cmp-review"
                    approveLabel="Approve campaign"
                    approveWarning={<>“{open.name}” will be approved. The advertiser is then asked to pay through Stripe Checkout, and you can schedule it. Nothing goes live until it is paid.</>}
                    onDecision={async (decision, note) => {
                      await adService.review(open.id, decision, note, user);
                      toast.success(decision === "approve" ? "Campaign approved" : decision === "reject" ? "Campaign rejected" : "Changes requested");
                    }}
                  />
                ) : (
                  <p className="rounded-md border border-sand-300 bg-sand-100 p-3 text-sm text-sand-700">You don&apos;t have permission to review {openProduct.family === "sponsorship" ? "sponsorships" : "advertising"}.</p>
                ))}

                {open.status === "approved" && canReview && (
                  <section className="space-y-3 rounded-lg border bg-white p-4" aria-labelledby="sch-h">
                    <h3 id="sch-h" className="font-sans text-sm font-semibold text-olive-950">Schedule</h3>
                    <FormField label="Start date" htmlFor="sch-date" hint={`${open.durationDays}-day run → ends ${formatDate(addDaysISO(start, open.durationDays))}. ${openAvail} of ${openProduct.totalSlots} slots free for these dates.`}>
                      <Input id="sch-date" type="date" min={daysFromToday(0)} value={start} onChange={(e) => setStart(e.target.value)} className="w-48" />
                    </FormField>
                    <Button onClick={schedule} disabled={scheduling || openAvail === 0}>{scheduling ? <><Loader2 className="animate-spin" /> Scheduling…</> : <><CalendarCheck /> Schedule campaign</>}</Button>
                    {open.paymentStatus === "unpaid" && <p className="text-xs text-muted-foreground">The advertiser hasn&apos;t paid yet — the campaign stays “awaiting payment” and won&apos;t run until Stripe confirms payment.</p>}
                  </section>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
