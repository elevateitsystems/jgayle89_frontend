"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { BadgePill } from "./business-badge";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { ReviewActions } from "@/components/dashboard/review-actions";
import { BadgeRequestPill } from "@/components/dashboard/status-pill";
import { formatBytes } from "@/components/shared/attachment-uploader";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useBadgeRequests, useBadges } from "@/features/badges/hooks";
import { useSession } from "@/hooks/use-session";
import { formatDate, todayISO } from "@/lib/date";
import { badgeService } from "@/services/badge-service";
import type { BadgeRequest, BadgeRequestStatus } from "@/types";

/** Staff → Business Verification: review badge requests, inspect documents, record the verification date. */
export function VerificationQueue() {
  const user = useSession();
  const requests = useBadgeRequests();
  const badges = useBadges();
  const [status, setStatus] = useState<"" | BadgeRequestStatus>("pending");
  const [openId, setOpenId] = useState<string | null>(null);
  const [verifiedOn, setVerifiedOn] = useState(todayISO());

  const rows = useMemo(() => requests.filter((r) => !status || r.status === status), [requests, status]);
  const open = requests.find((r) => r.id === openId) ?? null;
  const badgeOf = (id: string) => badges.find((b) => b.id === id);
  const pending = requests.filter((r) => r.status === "pending").length;

  const columns: Column<BadgeRequest>[] = [
    {
      id: "business", header: "Business", sort: (r) => r.businessName,
      cell: (r) => (
        <button type="button" onClick={() => { setOpenId(r.id); setVerifiedOn(todayISO()); }} className="block max-w-[15rem] text-left">
          <span className="block truncate font-semibold text-olive-950 hover:text-olive-700">{r.businessName}</span>
          <span className="block truncate text-xs text-muted-foreground">by {r.requesterName}</span>
        </button>
      ),
    },
    { id: "badge", header: "Badge", sort: (r) => badgeOf(r.badgeId)?.name ?? "", cell: (r) => { const b = badgeOf(r.badgeId); return b ? <BadgePill badge={b} /> : "—"; } },
    { id: "docs", header: "Documents", hideBelow: "md", cell: (r) => (r.documents.length ? `${r.documents.length} file${r.documents.length === 1 ? "" : "s"}` : "None") },
    { id: "date", header: "Submitted", hideBelow: "sm", sort: (r) => r.createdAt, cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(r.createdAt)}</span> },
    { id: "status", header: "Status", sort: (r) => r.status, cell: (r) => <BadgeRequestPill status={r.status} /> },
    { id: "act", header: "Review", srOnlyHeader: true, cell: (r) => <button type="button" onClick={() => { setOpenId(r.id); setVerifiedOn(todayISO()); }} className="text-sm font-semibold text-olive-700 hover:underline">{r.status === "pending" ? "Review" : "View"}</button> },
  ];

  const openBadge = open ? badgeOf(open.badgeId) : undefined;

  return (
    <>
      <PageHeader title="Business verification" description={`${pending} request${pending === 1 ? "" : "s"} waiting. Badges are earned through review — membership never grants one.`} />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        label="Badge requests"
        defaultSort={{ id: "date", dir: "asc" }}
        search={{ placeholder: "Search by business or owner", text: (r) => `${r.businessName} ${r.requesterName} ${badgeOf(r.badgeId)?.name ?? ""}` }}
        filters={
          <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-44">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </NativeSelect>
        }
        noMatches={{ onClear: () => setStatus("") }}
        empty={{ title: "No badge requests", description: "Requests from business owners will appear here." }}
      />

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-xl">
          {open && (
            <>
              <SheetHeader className="border-b border-sand-200 p-5">
                <SheetTitle>{open.businessName}</SheetTitle>
                <SheetDescription>{openBadge?.name} · requested {formatDate(open.createdAt)} by {open.requesterName}</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                <div className="flex items-center justify-between gap-2">{openBadge && <BadgePill badge={openBadge} size="md" />}<BadgeRequestPill status={open.status} /></div>
                {openBadge && <p className="rounded-md bg-sand-100 p-3 text-xs text-sand-700"><strong>Criteria:</strong> {openBadge.criteria}</p>}
                <section><h3 className="mb-1.5 font-sans text-sm font-semibold text-olive-950">Owner&apos;s note</h3><p className="rounded-md border bg-white p-3 text-sm">{open.note || "—"}</p></section>

                <section aria-labelledby="vq-docs">
                  <h3 id="vq-docs" className="mb-2 font-sans text-sm font-semibold text-olive-950">Supporting documents</h3>
                  {open.documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents attached{openBadge?.requiresDocuments ? " — this badge normally requires them." : "."}</p>
                  ) : (
                    <ul className="grid gap-3 sm:grid-cols-2">
                      {open.documents.map((d) => (
                        <li key={d.id} className="overflow-hidden rounded-md border bg-white">
                          {d.type.startsWith("image/") && d.url ? (
                            <a href={d.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-[4/3] bg-sand-200"><Image src={d.url} alt={`Preview of ${d.name}`} fill unoptimized sizes="280px" className="object-cover" /></a>
                          ) : (
                            <div className="flex aspect-[4/3] flex-col items-center justify-center gap-1 bg-sand-100 text-xs text-muted-foreground">
                              {d.url ? <a href={d.url} download={d.name} className="font-semibold text-olive-700 underline">Download PDF</a> : <><FileText className="size-8 text-olive-700" aria-hidden /> Preview unavailable in the demo</>}
                            </div>
                          )}
                          <p className="truncate px-3 py-2 text-xs"><span className="font-medium">{d.name}</span> · {formatBytes(d.size)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {open.status !== "pending" && (
                  <section className="rounded-md border bg-white p-3 text-sm">
                    <p><strong>{open.status === "approved" ? "Approved" : "Rejected"}</strong> by {open.reviewerName} on {open.reviewedOn ? formatDate(open.reviewedOn) : "—"}</p>
                    {open.verifiedOn && <p className="text-muted-foreground">Verification date recorded: {formatDate(open.verifiedOn)}</p>}
                    {open.reviewNote && <p className="mt-1 text-muted-foreground">{open.reviewNote}</p>}
                  </section>
                )}

                {open.status === "pending" && user && (
                  <ReviewActions
                    idPrefix="vq"
                    allowRequestChanges={false}
                    approveLabel="Approve & assign badge"
                    approveWarning={<>The <strong>{openBadge?.name}</strong> badge will be assigned to <strong>{open.businessName}</strong> with a verification date of {formatDate(verifiedOn)}, and shown publicly.</>}
                    noteHint="Required when rejecting. Approval notes are optional."
                    validateApprove={() => (!verifiedOn ? "Record the verification date." : verifiedOn > todayISO() ? "The verification date can't be in the future." : null)}
                    onDecision={async (decision, note) => {
                      await badgeService.review(open.id, decision === "approve" ? "approve" : "reject", { verifiedOn, note }, user);
                      toast.success(decision === "approve" ? "Badge assigned" : "Request rejected");
                    }}
                  >
                    <FormField label="Verification date" htmlFor="vq-date" hint="The date the documents were checked.">
                      <Input id="vq-date" type="date" max={todayISO()} value={verifiedOn} onChange={(e) => setVerifiedOn(e.target.value)} className="w-48" />
                    </FormField>
                  </ReviewActions>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
