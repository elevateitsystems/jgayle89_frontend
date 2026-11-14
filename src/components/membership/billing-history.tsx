"use client";

import { Download } from "lucide-react";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { InvoiceStatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/features/membership/access";
import { formatDate } from "@/lib/date";
import type { Invoice } from "@/types";

/**
 * Billing history. The receipt button is disabled until Stripe is connected — receipts come from
 * Stripe-hosted invoice URLs (`reference` holds the Stripe invoice / payment-intent id).
 */
export function BillingHistory({ invoices, showKind = false, loading }: { invoices: Invoice[]; showKind?: boolean; loading?: boolean }) {
  const columns: Column<Invoice>[] = [
    { id: "date", header: "Date", sort: (i) => i.date, cell: (i) => <span className="whitespace-nowrap">{formatDate(i.date)}</span> },
    {
      id: "desc",
      header: "Description",
      cell: (i) => (
        <span className="block min-w-40">
          <span className="block font-medium text-olive-950">{i.description}</span>
          {showKind && <span className="block text-xs capitalize text-muted-foreground">{i.kind}</span>}
        </span>
      ),
    },
    { id: "amount", header: "Amount", sort: (i) => i.amount, cell: (i) => <span className="tabular-nums">{formatPrice(i.amount)}</span> },
    { id: "status", header: "Status", cell: (i) => <InvoiceStatusPill status={i.status} /> },
    {
      id: "receipt",
      header: "Receipt",
      srOnlyHeader: true,
      cell: (i) => (
        <Button variant="ghost" size="sm" disabled title="Receipts become available once Stripe is connected" aria-label={`Download receipt for ${i.description}`}>
          <Download /> <span className="hidden sm:inline">Receipt</span>
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      rows={invoices}
      columns={columns}
      rowKey={(i) => i.id}
      label="Billing history"
      loading={loading}
      pageSize={6}
      defaultSort={{ id: "date", dir: "desc" }}
      search={{ placeholder: "Search billing history", text: (i) => `${i.description} ${i.kind} ${i.status}` }}
      empty={{ title: "No payments yet", description: "Charges for paid plans and advertising will appear here." }}
    />
  );
}
