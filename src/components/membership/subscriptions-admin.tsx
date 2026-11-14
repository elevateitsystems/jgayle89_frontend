"use client";

import { useMemo, useState } from "react";
import { Loader2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionStatusBadge } from "./subscription-summary";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { formatPrice, plansFor, priceFor } from "@/features/membership/access";
import { useAllPlans, useSubscriptions } from "@/features/membership/hooks";
import { useBusinesses } from "@/hooks/use-businesses";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { formatDate } from "@/lib/date";
import { AUDIENCE_LABEL } from "@/lib/mock-data/membership";
import { subscriptionService } from "@/services/membership-service";
import { userStore } from "@/services/user-service";
import type { BillingCycle, PlanAudience, Subscription, SubscriptionStatus } from "@/types";

/** Admin → Subscriptions. Admins can assign plans without payment (comps / fixes) and change status. Customer purchases go through Stripe. */
export function SubscriptionsAdmin() {
  const admin = useSession();
  const subs = useSubscriptions();
  const plans = useAllPlans();
  const users = useStore(userStore);
  const { businesses } = useBusinesses();
  const [audience, setAudience] = useState<"" | PlanAudience>("");
  const [status, setStatus] = useState<"" | SubscriptionStatus>("");
  const [assign, setAssign] = useState<Subscription | null>(null);
  const [cancelling, setCancelling] = useState<Subscription | null>(null);

  const subjectName = (s: Subscription) => (s.audience === "business" ? businesses.find((b) => b.id === s.subjectId)?.name : users.find((u) => u.id === s.subjectId)?.name) ?? s.subjectId;
  const ownerName = (s: Subscription) => users.find((u) => u.id === s.ownerId)?.name ?? "—";
  const planName = (id: string) => plans.find((p) => p.id === id)?.name ?? id;
  const rows = useMemo(() => subs.filter((s) => (!audience || s.audience === audience) && (!status || s.status === status)), [subs, audience, status]);

  const mrr = useMemo(
    () => subs.filter((s) => s.status === "active" || s.status === "past_due").reduce((n, s) => {
      const p = plans.find((x) => x.id === s.planId);
      return n + (p ? (s.cycle === "annual" ? p.annualPrice / 12 : p.monthlyPrice) : 0);
    }, 0),
    [subs, plans],
  );

  const columns: Column<Subscription>[] = [
    { id: "subject", header: "Account", sort: (s) => subjectName(s), cell: (s) => <span className="block max-w-[14rem]"><span className="block truncate font-semibold text-olive-950">{subjectName(s)}</span><span className="block truncate text-xs text-muted-foreground">{AUDIENCE_LABEL[s.audience]}{s.audience === "business" ? ` · ${ownerName(s)}` : ""}</span></span> },
    { id: "plan", header: "Plan", sort: (s) => planName(s.planId), cell: (s) => <span>{planName(s.planId)}{s.scheduledPlanId && <span className="block text-xs text-muted-foreground">→ {planName(s.scheduledPlanId)} at renewal</span>}</span> },
    { id: "price", header: "Billing", hideBelow: "md", sort: (s) => { const p = plans.find((x) => x.id === s.planId); return p ? priceFor(p, s.cycle) : 0; }, cell: (s) => { const p = plans.find((x) => x.id === s.planId); return p ? <span className="whitespace-nowrap tabular-nums">{formatPrice(priceFor(p, s.cycle))} / {s.cycle === "annual" ? "yr" : "mo"}</span> : "—"; } },
    { id: "renews", header: "Renews", hideBelow: "lg", sort: (s) => s.renewsOn ?? "", cell: (s) => <span className="whitespace-nowrap text-muted-foreground">{s.renewsOn ? formatDate(s.renewsOn) : "—"}</span> },
    { id: "status", header: "Status", sort: (s) => s.status, cell: (s) => <SubscriptionStatusBadge subscription={s} /> },
    {
      id: "act", header: "Actions", srOnlyHeader: true,
      cell: (s) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${subjectName(s)}`} />}><MoreHorizontal /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setAssign(s)}>Change plan (no payment)</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={s.status === "canceled"} onClick={() => setCancelling(s)}>Cancel now</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Subscriptions" description="Every member and business subscription. Customers upgrade through Stripe Checkout; administrators can correct or comp a plan here." />
      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Subscriptions", subs.length], ["Active", subs.filter((s) => s.status === "active").length], ["Past due", subs.filter((s) => s.status === "past_due").length], ["Est. monthly recurring", formatPrice(Math.round(mrr))]].map(([k, v]) => (
          <div key={k as string} className="rounded-lg border bg-card p-4 shadow-card"><dt className="text-xs font-medium text-muted-foreground">{k}</dt><dd className="mt-1 font-heading text-3xl font-semibold tabular-nums text-olive-950">{v}</dd></div>
        ))}
      </dl>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(s) => s.id}
        label="Subscriptions"
        defaultSort={{ id: "status", dir: "desc" }}
        search={{ placeholder: "Search by account or plan", text: (s) => `${subjectName(s)} ${ownerName(s)} ${planName(s.planId)}` }}
        filters={
          <>
            <NativeSelect aria-label="Filter by audience" value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)} className="w-44">
              <option value="">All audiences</option>
              {(Object.keys(AUDIENCE_LABEL) as PlanAudience[]).map((a) => <option key={a} value={a}>{AUDIENCE_LABEL[a]}</option>)}
            </NativeSelect>
            <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-40">
              <option value="">All statuses</option>
              {(["active", "past_due", "trialing", "canceled", "expired"] as const).map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
            </NativeSelect>
          </>
        }
        noMatches={{ onClear: () => { setAudience(""); setStatus(""); } }}
        empty={{ title: "No subscriptions", description: "Paid plans will appear here." }}
      />

      <AssignDialog sub={assign} onClose={() => setAssign(null)} name={assign ? subjectName(assign) : ""} adminId={admin?.id} />

      <ConfirmDialog
        open={!!cancelling}
        onOpenChange={(o) => !o && setCancelling(null)}
        destructive
        title="Cancel this subscription now?"
        description={<><strong>{cancelling ? subjectName(cancelling) : ""}</strong> moves to the Free plan immediately. This doesn&apos;t refund anything — refunds are issued in Stripe.</>}
        confirmLabel="Cancel subscription"
        busyLabel="Canceling…"
        successMessage="Subscription canceled"
        onConfirm={async () => { if (cancelling && admin) await subscriptionService.adminSetStatus(cancelling.id, "canceled", admin); }}
      />
    </>
  );
}

function AssignDialog({ sub, onClose, name, adminId }: { sub: Subscription | null; onClose: () => void; name: string; adminId?: string }) {
  const plans = useAllPlans();
  const admin = useSession();
  const [planId, setPlanId] = useState("");
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [busy, setBusy] = useState(false);
  const available = sub ? plansFor(plans, sub.audience) : [];
  const selected = planId || sub?.planId || "";

  async function save() {
    if (!sub || !admin || !adminId) return;
    setBusy(true);
    try {
      await subscriptionService.adminAssign({ audience: sub.audience, subjectId: sub.subjectId, ownerId: sub.ownerId, planId: selected, cycle: sub ? (cycle || sub.cycle) : cycle, status: "active" }, admin);
      toast.success("Plan updated", { description: "No payment was taken." });
      onClose();
    } catch (e) {
      toast.error("Couldn't change the plan", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!sub} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Change plan for {name}</DialogTitle><DialogDescription>Administrative override: the plan changes immediately and no payment is taken or refunded.</DialogDescription></DialogHeader>
        <div className="space-y-4">
          <FormField label="Plan" htmlFor="as-plan"><NativeSelect id="as-plan" value={selected} onChange={(e) => setPlanId(e.target.value)}>{available.map((p) => <option key={p.id} value={p.id}>{p.name}{p.active ? "" : " (inactive)"}</option>)}</NativeSelect></FormField>
          <FormField label="Billing period" htmlFor="as-cycle"><NativeSelect id="as-cycle" value={cycle} onChange={(e) => setCycle(e.target.value as BillingCycle)}><option value="monthly">Monthly</option><option value="annual">Annual</option></NativeSelect></FormField>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy}>{busy ? <><Loader2 className="animate-spin" /> Saving…</> : "Change plan"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
