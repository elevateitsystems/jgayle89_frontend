"use client";

import { useMemo, useState } from "react";
import { AdminBusinessLink, AdminMemberLink } from "./entity-links";
import { PageHeader } from "./page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { ORDER_STATUS, PAYMENT_STATUS } from "@/components/services/services-catalog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { formatPrice } from "@/features/membership/access";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { formatDate } from "@/lib/date";
import { isBackOffice } from "@/lib/permissions";
import { toast } from "sonner";
import { marketplaceService, orderStore } from "@/services/marketplace-service";
import { userStore } from "@/services/user-service";
import type { ServiceOrder, ServiceOrderStatus } from "@/types";

/** Admin / Staff → Service Orders: every purchase creates a record here (client update §6). */
export function ServiceOrdersAdmin() {
  const user = useSession();
  const orders = useStore(orderStore);
  const users = useStore(userStore);
  const staff = useMemo(() => users.filter((u) => isBackOffice(u) && u.status === "active"), [users]);
  const [status, setStatus] = useState("");
  const rows = useMemo(() => orders.filter((o) => !status || o.status === status), [orders, status]);

  async function update(o: ServiceOrder, patch: Parameters<typeof marketplaceService.updateOrder>[1], ok: string) {
    if (!user) return;
    try { await marketplaceService.updateOrder(o.id, patch, user); toast.success(ok); } catch (e) { toast.error("Couldn't update", { description: e instanceof Error ? e.message : undefined }); }
  }

  const columns: Column<ServiceOrder>[] = [
    {
      id: "svc", header: "Service", sort: (o) => o.serviceName,
      cell: (o) => <span className="block max-w-[14rem]"><span className="block truncate font-semibold text-olive-950">{o.serviceName}</span><span className="block text-xs text-muted-foreground">{formatDate(o.createdAt.slice(0, 10))}{o.notes ? ` · “${o.notes}”` : ""}</span></span>,
    },
    {
      id: "buyer", header: "Member / business", sort: (o) => o.buyerName,
      cell: (o) => <span className="flex flex-col"><AdminMemberLink userId={o.buyerId} name={o.buyerName} className="text-sm" />{o.businessId && <AdminBusinessLink businessId={o.businessId} className="text-xs font-medium" />}</span>,
    },
    { id: "total", header: "Total", hideBelow: "md", sort: (o) => o.total, cell: (o) => <span className="flex flex-col items-start gap-1 tabular-nums">{formatPrice(o.total)}{o.promotionLabel && <span className="text-xs text-muted-foreground">{o.promotionLabel}</span>}<StatusPill tone={PAYMENT_STATUS[o.paymentStatus].tone}>{PAYMENT_STATUS[o.paymentStatus].label}</StatusPill></span> },
    {
      id: "status", header: "Status", sort: (o) => o.status,
      cell: (o) => (
        <NativeSelect aria-label={`Status of ${o.serviceName} for ${o.buyerName}`} value={o.status} onChange={(e) => update(o, { status: e.target.value as ServiceOrderStatus }, "Status updated")} className="h-8 w-36 text-xs">
          {(Object.keys(ORDER_STATUS) as ServiceOrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
        </NativeSelect>
      ),
    },
    {
      id: "assigned", header: "Assigned to", hideBelow: "lg", sort: (o) => o.assignedTo ?? "",
      cell: (o) => (
        <NativeSelect aria-label={`Assign ${o.serviceName}`} value={o.assignedTo ?? ""} onChange={(e) => update(o, { assignedTo: e.target.value || undefined }, "Assignment updated")} className="h-8 w-40 text-xs">
          <option value="">Unassigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </NativeSelect>
      ),
    },
    {
      id: "date", header: "Scheduled", hideBelow: "lg", sort: (o) => o.scheduledFor ?? "",
      cell: (o) => <Input type="date" aria-label={`Schedule ${o.serviceName}`} value={o.scheduledFor ?? ""} onChange={(e) => update(o, { scheduledFor: e.target.value || undefined, ...(e.target.value && o.status === "pending" ? { status: "scheduled" as const } : {}) }, "Schedule updated")} className="h-8 w-40 text-xs" />,
    },
  ];

  return (
    <>
      <PageHeader title="Service orders" description="Purchases and service requests from members and businesses. Payment status is set by Stripe once connected — in this preview new orders stay “Awaiting payment”." />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(o) => o.id}
        label="Service orders"
        pageSize={10}
        defaultSort={{ id: "svc", dir: "asc" }}
        search={{ placeholder: "Search by service or buyer", text: (o) => `${o.serviceName} ${o.buyerName}` }}
        filters={
          <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
            <option value="">All statuses</option>
            {(Object.keys(ORDER_STATUS) as ServiceOrderStatus[]).map((s) => <option key={s} value={s}>{ORDER_STATUS[s].label}</option>)}
          </NativeSelect>
        }
        noMatches={{ onClear: () => setStatus("") }}
        empty={{ title: "No orders yet", description: "Purchases appear here as soon as they're made." }}
      />
    </>
  );
}
