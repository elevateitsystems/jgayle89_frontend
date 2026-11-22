"use client";

import { useMemo, useState } from "react";
import { Check, Eye, EyeOff, MessageSquareWarning, MoreHorizontal, NotebookPen, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { AdminBusinessLink } from "./entity-links";
import { SearchableBusinessSelector } from "./searchable-business-selector";
import { PageHeader } from "./page-header";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { OfferFormSheet, approvalNoteFor } from "@/components/offers/offer-form";
import { OfferStatusPill } from "@/components/offers/offer-ui";
import { RejectOfferDialog } from "@/components/offers/reject-offer-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { awaitingFrom, offerDisplayStatus, requiredApprovals, OFFER_AUDIENCE_LABEL } from "@/features/offers/rules";
import { useOffers } from "@/features/offers/hooks";
import { useSession } from "@/hooks/use-session";
import { useSiteSettings } from "@/hooks/use-settings";
import { formatDate, todayISO } from "@/lib/date";
import { offerService } from "@/services/offer-service";
import type { BusinessOffer } from "@/types";

const STATUS_FILTERS = [
  ["needs_staff", "Needs staff approval"],
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["published", "Published"],
  ["rejected", "Rejected"],
  ["inactive", "Deactivated"],
  ["expired", "Expired"],
] as const;

/** Admin / Staff → Business Offers (client update §4C): create, edit, approve, reject, deactivate and remove. */
export function BusinessOffersAdmin() {
  const user = useSession();
  const settings = useSiteSettings();
  const offers = useOffers();
  const [filter, setFilter] = useState<string>("needs_staff");
  const [editing, setEditing] = useState<BusinessOffer | "new" | null>(null);
  const [newBusinessId, setNewBusinessId] = useState("");
  const [rejecting, setRejecting] = useState<BusinessOffer | null>(null);
  const [notesFor, setNotesFor] = useState<BusinessOffer | null>(null);
  const [toRemove, setToRemove] = useState<BusinessOffer | null>(null);
  const today = todayISO();

  const rows = useMemo(() => offers.filter((o) => {
    if (!filter) return true;
    if (filter === "needs_staff") return awaitingFrom(o).includes("staff");
    return offerDisplayStatus(o, today) === filter;
  }), [offers, filter, today]);
  const needsStaff = offers.filter((o) => awaitingFrom(o).includes("staff")).length;

  async function run(fn: () => Promise<unknown>, ok: string) {
    try { await fn(); toast.success(ok); } catch (e) { toast.error("Couldn't update the offer", { description: e instanceof Error ? e.message : undefined }); }
  }

  const columns: Column<BusinessOffer>[] = [
    {
      id: "offer", header: "Offer", sort: (o) => o.title,
      cell: (o) => (
        <span className="block max-w-[18rem]">
          <span className="block truncate font-semibold text-olive-950">{o.title}</span>
          <span className="block truncate text-xs text-muted-foreground">{o.discountText} · {OFFER_AUDIENCE_LABEL[o.audience]}</span>
          <span className="block truncate text-xs sm:hidden"><AdminBusinessLink businessId={o.businessId} className="font-medium" /></span>
          {o.talkRequested && <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-destructive"><MessageSquareWarning className="size-3" aria-hidden /> Owner asked to speak with staff</span>}
        </span>
      ),
    },
    { id: "biz", header: "Business", hideBelow: "sm", sort: (o) => o.businessId, cell: (o) => <AdminBusinessLink businessId={o.businessId} className="text-sm" /> },
    {
      id: "status", header: "Status", sort: (o) => offerDisplayStatus(o, today),
      cell: (o) => {
        const waiting = awaitingFrom(o);
        return (
          <span className="flex flex-col items-start gap-1">
            <OfferStatusPill offer={o} />
            {waiting.length > 0 && <span className="text-xs text-muted-foreground">Awaiting {waiting.join(" & ")}</span>}
          </span>
        );
      },
    },
    { id: "origin", header: "Submitted by", hideBelow: "lg", sort: (o) => o.origin, cell: (o) => <span className="text-sm">{o.createdByName} <span className="text-xs text-muted-foreground">({o.origin === "owner" ? "owner" : "staff"})</span></span> },
    { id: "dates", header: "Runs", hideBelow: "md", sort: (o) => o.startsOn, cell: (o) => <span className="text-sm">{formatDate(o.startsOn)}{o.expiresOn ? ` – ${formatDate(o.expiresOn)}` : " · ongoing"}</span> },
    {
      id: "act", header: "Actions", srOnlyHeader: true,
      cell: (o) => {
        const canApprove = user && awaitingFrom(o).includes("staff");
        return (
          <span className="flex items-center justify-end gap-1">
            {canApprove && <Button size="sm" onClick={() => run(() => offerService.approve(o.id, "staff", user), "Offer approved")}><Check /> Approve</Button>}
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${o.title}`} />}><MoreHorizontal /></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                {o.status === "pending" && <DropdownMenuItem onClick={() => setRejecting(o)}><X /> Reject</DropdownMenuItem>}
                <DropdownMenuItem onClick={() => setEditing(o)}><Pencil /> Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNotesFor(o)}><NotebookPen /> Internal notes</DropdownMenuItem>
                {o.status === "inactive"
                  ? <DropdownMenuItem onClick={() => user && run(() => offerService.setActive(o.id, true, user), "Offer reactivated")}><Eye /> Reactivate</DropdownMenuItem>
                  : <DropdownMenuItem onClick={() => user && run(() => offerService.setActive(o.id, false, user), "Offer deactivated")}><EyeOff /> Deactivate</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => setToRemove(o)}><Trash2 /> Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        );
      },
    },
  ];

  const staffRequires = requiredApprovals(settings.offerApproval.staffCreated, "staff");

  return (
    <>
      <PageHeader
        title="Business offers"
        description="Discounts and special offers on business profiles. Approval rules are set in Settings; rejected owners can ask to speak with staff."
        actions={<Button onClick={() => { setNewBusinessId(""); setEditing("new"); }}><Plus /> New offer</Button>}
      />
      {needsStaff > 0 && <p className="mb-4"><StatusPill tone="warn">{needsStaff} waiting for staff approval</StatusPill></p>}
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(o) => o.id}
        label="Business offers"
        pageSize={10}
        defaultSort={{ id: "dates", dir: "desc" }}
        search={{ placeholder: "Search offers", text: (o) => `${o.title} ${o.discountText} ${o.audience} ${o.businessId}` }}
        filters={
          <NativeSelect aria-label="Filter by status" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-56">
            <option value="">All offers</option>
            {STATUS_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </NativeSelect>
        }
        noMatches={{ onClear: () => setFilter("") }}
        empty={{ title: "No offers", description: "Nothing matches this filter." }}
      />

      <OfferFormSheet
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        offer={editing && editing !== "new" ? editing : null}
        approvalNote={approvalNoteFor(staffRequires)}
        before={editing === "new" ? <SearchableBusinessSelector value={newBusinessId} onChange={setNewBusinessId} id="of-biz" /> : undefined}
        onSubmit={async (input) => {
          if (!user) return;
          try {
            if (editing === "new") {
              if (!newBusinessId) throw new Error("Choose a business first.");
              await offerService.createByStaff(newBusinessId, input, user);
            } else if (editing) await offerService.update(editing.id, input, user, "staff");
            toast.success("Offer saved", { description: approvalNoteFor(staffRequires) });
            setEditing(null);
          } catch (e) {
            toast.error("Couldn't save the offer", { description: e instanceof Error ? e.message : undefined });
          }
        }}
      />

      <RejectOfferDialog
        open={!!rejecting}
        onOpenChange={(o) => !o && setRejecting(null)}
        title={rejecting?.title ?? ""}
        side="staff"
        onReject={async (reason, notes) => { if (rejecting && user) await run(() => offerService.reject(rejecting.id, "staff", user, reason, notes), "Offer rejected"); }}
      />
      <NotesDialog offer={notesFor} onClose={() => setNotesFor(null)} />
      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        destructive
        title="Remove this offer?"
        description={`“${toRemove?.title ?? ""}” will be deleted. To hide it but keep its history, deactivate it instead.`}
        confirmLabel="Remove offer"
        busyLabel="Removing…"
        successMessage="Offer removed"
        onConfirm={async () => { if (toRemove && user) await offerService.remove(toRemove.id, user); }}
      />
    </>
  );
}

function NotesDialog({ offer, onClose }: { offer: BusinessOffer | null; onClose: () => void }) {
  const user = useSession();
  return (
    <Dialog open={!!offer} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {offer && <NotesBody key={offer.id} offer={offer} onClose={onClose} save={async (notes) => { if (user) await offerService.setStaffNotes(offer.id, notes, user); }} />}
      </DialogContent>
    </Dialog>
  );
}

function NotesBody({ offer, onClose, save }: { offer: BusinessOffer; onClose: () => void; save: (notes: string) => Promise<void> }) {
  const [notes, setNotes] = useState(offer.staffNotes ?? "");
  return (
    <>
      <DialogHeader>
        <DialogTitle>Internal notes · {offer.title}</DialogTitle>
        <DialogDescription>Visible to staff and administrators only — never to the business.</DialogDescription>
      </DialogHeader>
      {offer.rejectionReason && <p className="rounded-md bg-sand-100 px-3 py-2 text-sm"><span className="font-semibold">Reason given to the business:</span> {offer.rejectionReason}</p>}
      <FormField label="Staff notes" htmlFor="off-notes"><Textarea id="off-notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField>
      <ol className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground" aria-label="Offer history">
        {offer.history.map((h, i) => <li key={i}>{formatDate(h.at.slice(0, 10))} · {h.by} · {h.action.replace("_", " ")}{h.note ? ` — ${h.note}` : ""}</li>)}
      </ol>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
        <Button onClick={async () => { await save(notes); toast.success("Notes saved"); onClose(); }}>Save notes</Button>
      </DialogFooter>
    </>
  );
}
