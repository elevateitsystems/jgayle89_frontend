"use client";

import { useMemo, useState } from "react";
import { Download, Info } from "lucide-react";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { InvoiceStatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { formatPrice } from "@/features/membership/access";
import { useInvoices } from "@/features/membership/hooks";
import { useBusinesses } from "@/hooks/use-businesses";
import { useStore } from "@/hooks/use-store";
import { toCSV } from "@/lib/csv";
import { formatDate } from "@/lib/date";
import { userStore } from "@/services/user-service";
import type { Invoice, InvoiceKind, InvoiceStatus } from "@/types";

/** Admin → Payments & Transactions. Read-only: charges, refunds and disputes are handled in Stripe. */
export function PaymentsAdmin() {
  const invoices = useInvoices();
  const users = useStore(userStore);
  const { businesses } = useBusinesses();
  const [kind, setKind] = useState<"" | InvoiceKind>("");
  const [status, setStatus] = useState<"" | InvoiceStatus>("");

  const payer = (i: Invoice) => users.find((u) => u.id === i.userId)?.name ?? i.userId;
  const bizName = (i: Invoice) => (i.businessId ? businesses.find((b) => b.id === i.businessId)?.name : undefined);
  const rows = useMemo(() => invoices.filter((i) => (!kind || i.kind === kind) && (!status || i.status === status)), [invoices, kind, status]);

  const paid = invoices.filter((i) => i.status === "paid");
  const total = (k?: InvoiceKind) => paid.filter((i) => !k || i.kind === k).reduce((n, i) => n + i.amount, 0);

  function exportCsv() {
    const csv = toCSV([["id", "date", "type", "payer", "business", "description", "amount", "status", "reference"], ...rows.map((i) => [i.id, i.date, i.kind, payer(i), bizName(i) ?? "", i.description, i.amount, i.status, i.reference])]);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const columns: Column<Invoice>[] = [
    { id: "date", header: "Date", sort: (i) => i.date, cell: (i) => <span className="whitespace-nowrap">{formatDate(i.date)}</span> },
    { id: "desc", header: "Description", cell: (i) => <span className="block max-w-[18rem]"><span className="block truncate font-medium text-olive-950">{i.description}</span><span className="block truncate text-xs text-muted-foreground">{payer(i)}{bizName(i) ? ` · ${bizName(i)}` : ""}</span></span> },
    { id: "kind", header: "Type", hideBelow: "md", sort: (i) => i.kind, cell: (i) => <span className="capitalize">{i.kind}</span> },
    { id: "amount", header: "Amount", sort: (i) => i.amount, cell: (i) => <span className="tabular-nums">{formatPrice(i.amount)}</span> },
    { id: "status", header: "Status", sort: (i) => i.status, cell: (i) => <InvoiceStatusPill status={i.status} /> },
    { id: "ref", header: "Stripe reference", hideBelow: "lg", cell: (i) => <code className="text-xs text-muted-foreground">{i.reference}</code> },
  ];

  return (
    <>
      <PageHeader title="Payments & transactions" description="All membership and advertising charges." actions={<Button variant="outline" onClick={exportCsv}><Download /> Export CSV</Button>} />
      <p className="mb-6 flex items-start gap-2 rounded-md border border-sand-300 bg-sand-100 px-3 py-2.5 text-sm text-sand-700"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /> Sample transactions. Once Stripe is connected this table is fed by Stripe webhooks; refunds and disputes are handled in the Stripe dashboard.</p>
      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Total collected", formatPrice(total())], ["Memberships", formatPrice(total("membership"))], ["Advertising", formatPrice(total("advertising"))], ["Failed payments", invoices.filter((i) => i.status === "failed").length]].map(([k, v]) => (
          <div key={k as string} className="rounded-lg border bg-card p-4 shadow-card"><dt className="text-xs font-medium text-muted-foreground">{k}</dt><dd className="mt-1 font-heading text-3xl font-semibold tabular-nums text-olive-950">{v}</dd></div>
        ))}
      </dl>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(i) => i.id}
        label="Transactions"
        defaultSort={{ id: "date", dir: "desc" }}
        search={{ placeholder: "Search transactions", text: (i) => `${i.description} ${payer(i)} ${bizName(i) ?? ""} ${i.reference}` }}
        filters={
          <>
            <NativeSelect aria-label="Filter by type" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="w-40"><option value="">All types</option><option value="membership">Membership</option><option value="advertising">Advertising</option></NativeSelect>
            <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-40"><option value="">All statuses</option>{(["paid", "pending", "failed", "refunded"] as const).map((s) => <option key={s} value={s}>{s}</option>)}</NativeSelect>
          </>
        }
        noMatches={{ onClear: () => { setKind(""); setStatus(""); } }}
        empty={{ title: "No transactions yet", description: "Payments will appear here." }}
        pageSize={10}
      />
    </>
  );
}
