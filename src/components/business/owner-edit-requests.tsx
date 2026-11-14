"use client";

import { useMemo, useState } from "react";
import { FileEdit, Plus } from "lucide-react";
import { EditRequestDetail } from "./edit-request-detail";
import { EditRequestForm, type EditSection } from "./edit-request-form";
import { BusinessPicker, NoBusinesses, useSelectedBusiness } from "./business-picker";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { EditStatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect } from "@/components/ui/native-select";
import { summarizeChanges } from "@/features/business/changes";
import { useOwnedBusinesses, useOwnerEditRequests } from "@/features/business/hooks";
import { limitOf } from "@/features/membership/access";
import { useResolvedPlan } from "@/features/membership/hooks";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/date";
import type { Business, BusinessEditRequest, EditRequestStatus } from "@/types";

/** Plan limits that cap what an owner may request for social links and promotions. */
export function useEditCaps(businessId: string | undefined) {
  const plan = useResolvedPlan("business", businessId);
  return { socialLinks: limitOf(plan, "social_links"), promotions: limitOf(plan, "promotions") };
}

/** Owner → Edit Requests: request history with status, details and the "new request" flow. */
export function OwnerEditRequests() {
  const user = useSession();
  const { businesses, loading } = useOwnedBusinesses(user?.id);
  const requests = useOwnerEditRequests(user?.id);
  const { selected, setId } = useSelectedBusiness(businesses);
  const caps = useEditCaps(selected?.id);
  const [status, setStatus] = useState<"" | EditRequestStatus>("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<BusinessEditRequest | null>(null);
  const [revising, setRevising] = useState<BusinessEditRequest | null>(null);

  const rows = useMemo(() => requests.filter((r) => !status || r.status === status), [requests, status]);

  const columns: Column<BusinessEditRequest>[] = [
    {
      id: "request", header: "Request", sort: (r) => r.businessName,
      cell: (r) => (
        <button type="button" onClick={() => setViewing(r)} className="block max-w-[16rem] text-left">
          <span className="block truncate font-semibold text-olive-950 hover:text-olive-700">{r.businessName}</span>
          <span className="block truncate text-xs text-muted-foreground">{summarizeChanges(r.changes)}</span>
        </button>
      ),
    },
    { id: "submitted", header: "Submitted", sort: (r) => r.createdAt, hideBelow: "sm", cell: (r) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(r.createdAt)}</span> },
    { id: "status", header: "Status", sort: (r) => r.status, cell: (r) => <EditStatusPill status={r.status} /> },
    {
      id: "actions", header: "Actions", srOnlyHeader: true,
      cell: (r) => (
        <div className="flex justify-end gap-1.5">
          {r.status === "changes_requested" && <Button size="sm" onClick={() => setRevising(r)}>Revise</Button>}
          <Button size="sm" variant="outline" onClick={() => setViewing(r)}>View</Button>
        </div>
      ),
    },
  ];

  const reviseBusiness = revising ? businesses.find((b) => b.id === revising.businessId) : undefined;

  return (
    <>
      <PageHeader
        title="Edit requests"
        description="You can't change your public listing directly. Submit a request and Mission: SITREP staff will review it."
        actions={businesses.length > 0 && <Button onClick={() => setFormOpen(true)}><Plus /> New request</Button>}
      />

      {!loading && businesses.length === 0 ? (
        <NoBusinesses />
      ) : (
        <>
          <BusinessPicker businesses={businesses} value={selected?.id} onChange={setId} label="Request an edit for" />
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            label="Edit requests"
            loading={loading}
            defaultSort={{ id: "submitted", dir: "desc" }}
            search={{ placeholder: "Search requests", text: (r) => `${r.businessName} ${r.reason} ${summarizeChanges(r.changes)}` }}
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
            empty={{ title: "No edit requests yet", description: "When you want to change your listing, submit a request here.", actionLabel: "New request", onAction: () => setFormOpen(true) }}
          />
        </>
      )}

      {selected && <EditRequestForm open={formOpen} onOpenChange={setFormOpen} business={selected} caps={caps} />}
      {reviseBusiness && revising && (
        <EditRequestForm open onOpenChange={(o) => !o && setRevising(null)} business={reviseBusiness} request={revising} caps={caps} sections={sectionsFor(revising)} />
      )}
      <RequestDialog request={viewing} onClose={() => setViewing(null)} onRevise={(r) => { setViewing(null); setRevising(r); }} />
    </>
  );
}

/** Which form sections a request touched (so "Revise" opens only what's relevant). */
export function sectionsFor(r: BusinessEditRequest): EditSection[] {
  const keys = Object.keys(r.changes);
  const out: EditSection[] = [];
  if (keys.some((k) => k !== "socialLinks" && k !== "promotions")) out.push("details");
  if (keys.includes("socialLinks")) out.push("social");
  if (keys.includes("promotions")) out.push("promotions");
  return out.length ? out : ["details"];
}

function RequestDialog({ request, onClose, onRevise }: { request: BusinessEditRequest | null; onClose: () => void; onRevise: (r: BusinessEditRequest) => void }) {
  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        {request && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><FileEdit className="size-5 text-olive-600" aria-hidden /> {request.businessName}</DialogTitle>
              <DialogDescription>Your public listing only changes after staff approve the request.</DialogDescription>
            </DialogHeader>
            <EditRequestDetail request={request} />
            <DialogFooter>
              {request.status === "changes_requested" && <Button onClick={() => onRevise(request)}>Revise &amp; resubmit</Button>}
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export type { Business };
