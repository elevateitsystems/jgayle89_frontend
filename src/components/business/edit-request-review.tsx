"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EditRequestDetail } from "./edit-request-detail";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { ReviewActions } from "@/components/dashboard/review-actions";
import { EditStatusPill } from "@/components/dashboard/status-pill";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { summarizeChanges } from "@/features/business/changes";
import { useEditRequests } from "@/features/business/hooks";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/date";
import { editRequestService } from "@/services/edit-request-service";
import type { BusinessEditRequest, EditRequestStatus } from "@/types";

/** Staff → Business Edit Requests. Approving is the only way an owner's change reaches the public listing. */
export function EditRequestReviewQueue() {
  const user = useSession();
  const all = useEditRequests();
  const [status, setStatus] = useState<"" | EditRequestStatus>("pending");
  const [openId, setOpenId] = useState<string | null>(null);

  const rows = useMemo(() => all.filter((r) => !status || r.status === status), [all, status]);
  const open = all.find((r) => r.id === openId) ?? null; // read live so the sheet reflects the decision
  const pendingCount = all.filter((r) => r.status === "pending").length;

  const columns: Column<BusinessEditRequest>[] = [
    {
      id: "business", header: "Business", sort: (r) => r.businessName,
      cell: (r) => (
        <button type="button" onClick={() => setOpenId(r.id)} className="block max-w-[16rem] text-left">
          <span className="block truncate font-semibold text-olive-950 hover:text-olive-700">{r.businessName}</span>
          <span className="block truncate text-xs text-muted-foreground">{summarizeChanges(r.changes)}</span>
        </button>
      ),
    },
    { id: "owner", header: "Requested by", hideBelow: "md", sort: (r) => r.requesterName, cell: (r) => r.requesterName },
    { id: "date", header: "Submitted", hideBelow: "sm", sort: (r) => r.createdAt, cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(r.createdAt)}</span> },
    { id: "status", header: "Status", sort: (r) => r.status, cell: (r) => <EditStatusPill status={r.status} /> },
    { id: "act", header: "Review", srOnlyHeader: true, cell: (r) => <button type="button" onClick={() => setOpenId(r.id)} className="text-sm font-semibold text-olive-700 hover:underline">{r.status === "pending" ? "Review" : "View"}</button> },
  ];

  return (
    <>
      <PageHeader title="Business edit requests" description={`${pendingCount} request${pendingCount === 1 ? "" : "s"} waiting. Owners can't edit listings directly — approve a request to apply it.`} />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(r) => r.id}
        label="Edit requests"
        defaultSort={{ id: "date", dir: "asc" }}
        search={{ placeholder: "Search by business, owner or field", text: (r) => `${r.businessName} ${r.requesterName} ${summarizeChanges(r.changes)}` }}
        filters={
          <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="w-48">
            <option value="">All statuses</option>
            <option value="pending">Pending review</option>
            <option value="changes_requested">Changes requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </NativeSelect>
        }
        noMatches={{ onClear: () => setStatus("") }}
        empty={{ title: "No edit requests", description: "Requests from business owners will appear here." }}
      />

      <Sheet open={!!open} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-2xl">
          {open && (
            <>
              <SheetHeader className="border-b border-sand-200 p-5">
                <SheetTitle>{open.businessName}</SheetTitle>
                <SheetDescription>Review the requested changes against the live listing.</SheetDescription>
              </SheetHeader>
              <div className="flex-1 space-y-6 overflow-y-auto p-5">
                <EditRequestDetail request={open} />
                {open.status === "pending" && user && (
                  <ReviewActions
                    idPrefix="er-review"
                    approveLabel="Approve & publish changes"
                    approveWarning={<>The listing for <strong>{open.businessName}</strong> will be updated immediately and the changes will be visible publicly.</>}
                    onDecision={async (decision, note) => {
                      await editRequestService.review(open.id, decision, note, user);
                      toast.success(decision === "approve" ? "Changes published to the listing" : decision === "reject" ? "Request rejected" : "Changes requested from the owner");
                    }}
                  />
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
