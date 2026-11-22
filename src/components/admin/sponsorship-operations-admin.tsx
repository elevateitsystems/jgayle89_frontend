"use client";

import { useMemo, useState } from "react";
import { EyeOff, Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { SearchableBusinessSelector } from "@/components/admin/searchable-business-selector";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdProducts, usePromotionAssignments, useSponsorshipAssignments, useSponsorshipRequests } from "@/features/advertising/hooks";
import { useOffers } from "@/features/offers/hooks";
import { useSession } from "@/hooks/use-session";
import { formatDate, todayISO } from "@/lib/date";
import { promotionAssignmentStatus, sponsorshipAssignmentStatus, sponsorshipService } from "@/services/sponsorship-service";
import type { SponsorshipAssignment, SponsorshipRequest } from "@/types";

const requestTone = { submitted: "warn", in_review: "info", contacted: "info", resolved: "good", closed: "neutral" } as const;
const requestLabel = { submitted: "Submitted", in_review: "In review", contacted: "Contacted", resolved: "Resolved", closed: "Closed" } as const;

export function SponsorshipOperationsAdmin() {
  return (
    <>
      <PageHeader title="Sponsorship operations" description="Review business sponsorship conversations, assign approved packages, and place existing promotions on business listings."
        actions={<span className="text-xs text-muted-foreground">Demo data · no backend writes</span>} />
      <Tabs defaultValue="requests">
        <TabsList className="mb-4 h-auto flex-wrap p-1">
          <TabsTrigger value="requests" className="h-9 px-4">Staff requests</TabsTrigger>
          <TabsTrigger value="sponsorships" className="h-9 px-4">Assigned sponsorships</TabsTrigger>
          <TabsTrigger value="promotions" className="h-9 px-4">Assigned promotions</TabsTrigger>
        </TabsList>
        <TabsContent value="requests"><Requests /></TabsContent>
        <TabsContent value="sponsorships"><SponsorshipAssignments /></TabsContent>
        <TabsContent value="promotions"><PromotionAssignments /></TabsContent>
      </Tabs>
    </>
  );
}

function Requests() {
  const user = useSession();
  const requests = useSponsorshipRequests();
  const [selected, setSelected] = useState<SponsorshipRequest | null>(null);
  const [status, setStatus] = useState<SponsorshipRequest["status"]>("in_review");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const columns: Column<SponsorshipRequest>[] = [
    { id: "business", header: "Business", sort: (r) => r.businessName, cell: (r) => <span className="block max-w-[18rem]"><span className="block truncate font-semibold text-olive-950">{r.businessName}</span><span className="block truncate text-xs text-muted-foreground">{r.requesterName} · {r.requesterEmail}</span></span> },
    { id: "details", header: "Request", hideBelow: "md", cell: (r) => <span className="block max-w-[26rem] truncate text-sm">{r.details}</span> },
    { id: "status", header: "Status", sort: (r) => r.status, cell: (r) => <StatusPill tone={requestTone[r.status]}>{requestLabel[r.status]}</StatusPill> },
    { id: "date", header: "Submitted", hideBelow: "sm", sort: (r) => r.createdAt, cell: (r) => formatDate(r.createdAt) },
    { id: "act", header: "Review", srOnlyHeader: true, cell: (r) => <Button size="sm" variant="outline" onClick={() => { setSelected(r); setStatus(r.status); setNote(r.staffNote ?? ""); }}><MessageSquare /> Review</Button> },
  ];
  async function save() {
    if (!selected || !user) return;
    setSaving(true);
    try { await sponsorshipService.reviewRequest(selected.id, { status, staffNote: note }, user); toast.success("Request updated"); setSelected(null); }
    catch (e) { toast.error("Couldn't update the request", { description: e instanceof Error ? e.message : undefined }); }
    finally { setSaving(false); }
  }
  return <>
    <DataTable rows={requests} columns={columns} rowKey={(r) => r.id} label="Sponsorship requests" defaultSort={{ id: "date", dir: "desc" }} search={{ placeholder: "Search requests", text: (r) => `${r.businessName} ${r.requesterName} ${r.details}` }} empty={{ title: "No sponsorship requests", description: "Business-owner requests will appear here." }} />
    {selected && <div className="mt-4 rounded-lg border bg-card p-5 shadow-card"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-olive-950">Review request · {selected.businessName}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.requesterName} · {selected.requesterEmail}</p></div><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button></div><p className="mt-4 rounded-md bg-sand-50 p-3 text-sm">{selected.details}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><FormField label="Status" htmlFor="req-status"><NativeSelect id="req-status" value={status} onChange={(e) => setStatus(e.target.value as SponsorshipRequest["status"])}>{Object.entries(requestLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</NativeSelect></FormField><FormField label="Staff note" htmlFor="req-note" hint="Visible in the staff workflow; use this for follow-up context."><Textarea id="req-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></FormField></div><Button className="mt-4" onClick={save} disabled={saving}>{saving ? <><Loader2 className="animate-spin" /> Saving…</> : "Save review"}</Button></div>}
  </>;
}

function SponsorshipAssignments() {
  const user = useSession();
  const products = useAdProducts().filter((p) => p.family === "sponsorship");
  const assignments = useSponsorshipAssignments();
  const [businessId, setBusinessId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<SponsorshipAssignment | null>(null);
  const rows = useMemo(() => assignments.map((a) => ({ ...a, currentStatus: sponsorshipAssignmentStatus(a) })), [assignments]);
  const columns: Column<(typeof rows)[number]>[] = [
    { id: "business", header: "Business", sort: (a) => a.businessName, cell: (a) => <span className="font-semibold text-olive-950">{a.businessName}</span> },
    { id: "package", header: "Package", hideBelow: "md", cell: (a) => <span className="block max-w-[18rem]"><span className="block truncate">{a.packageName}</span><span className="block truncate text-xs text-muted-foreground">{a.placement}</span></span> },
    { id: "dates", header: "Dates", sort: (a) => a.startDate, cell: (a) => <span className="whitespace-nowrap text-sm">{formatDate(a.startDate)} – {formatDate(a.endDate)}</span> },
    { id: "status", header: "Status", sort: (a) => a.currentStatus, cell: (a) => <StatusPill tone={a.currentStatus === "active" ? "good" : a.currentStatus === "scheduled" ? "info" : "neutral"}>{a.currentStatus === "scheduled" ? "Upcoming" : a.currentStatus[0].toUpperCase() + a.currentStatus.slice(1)}</StatusPill> },
    { id: "act", header: "Actions", srOnlyHeader: true, cell: (a) => <Button size="sm" variant="ghost" onClick={() => setRemoving(a)}><Trash2 /> Remove</Button> },
  ];
  async function assign() {
    if (!user) return; setSaving(true);
    try { await sponsorshipService.assignSponsorship({ businessId, packageId, startDate, endDate, notes }, user); toast.success("Sponsorship assigned"); setBusinessId(""); setPackageId(""); setEndDate(""); setNotes(""); }
    catch (e) { toast.error("Couldn't assign the sponsorship", { description: e instanceof Error ? e.message : undefined }); }
    finally { setSaving(false); }
  }
  return <>
    {user?.role === "admin" ? <div className="mb-6 rounded-lg border bg-card p-5 shadow-card"><h2 className="font-semibold text-olive-950">Assign a sponsorship package</h2><p className="mt-1 text-sm text-muted-foreground">Admin-only assignment. Business owners cannot create or purchase sponsorship campaigns directly.</p><div className="mt-4 grid gap-4 lg:grid-cols-2"><SearchableBusinessSelector value={businessId} onChange={setBusinessId} id="sponsor-biz" /><FormField label="Sponsorship package" htmlFor="sponsor-package" required><NativeSelect id="sponsor-package" value={packageId} onChange={(e) => setPackageId(e.target.value)}><option value="">Select a package…</option>{products.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} · {p.placement}</option>)}</NativeSelect></FormField><FormField label="Start date" htmlFor="sponsor-start" required><Input id="sponsor-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></FormField><FormField label="End date" htmlFor="sponsor-end" required><Input id="sponsor-end" type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></FormField><FormField label="Assignment notes" htmlFor="sponsor-notes"><Textarea id="sponsor-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></FormField></div><Button className="mt-4" onClick={assign} disabled={saving || !businessId || !packageId || !endDate}>{saving ? <><Loader2 className="animate-spin" /> Assigning…</> : <><Plus /> Assign sponsorship</>}</Button></div> : <p className="mb-6 rounded-md border bg-sand-50 p-4 text-sm text-muted-foreground">Only administrators can assign sponsorship packages. This staff view is limited to request review.</p>}
    <DataTable rows={rows} columns={columns} rowKey={(a) => a.id} label="Sponsorship assignments" defaultSort={{ id: "dates", dir: "desc" }} search={{ placeholder: "Search assignments", text: (a) => `${a.businessName} ${a.packageName} ${a.currentStatus}` }} empty={{ title: "No sponsorship assignments", description: "Assigned packages will appear here." }} />
    <ConfirmDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)} destructive title="Remove this sponsorship assignment?" description={`This removes the assignment for ${removing?.businessName ?? "this business"}.`} confirmLabel="Remove assignment" busyLabel="Removing…" successMessage="Assignment removed" onConfirm={async () => { if (removing && user) await sponsorshipService.removeAssignment(removing.id, user); }} />
  </>;
}

function PromotionAssignments() {
  const user = useSession();
  const offers = useOffers();
  const assignments = usePromotionAssignments();
  const [businessId, setBusinessId] = useState("");
  const [offerId, setOfferId] = useState("");
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const rows = useMemo(() => assignments.map((a) => ({ ...a, currentStatus: promotionAssignmentStatus(a) })), [assignments]);
  const columns: Column<(typeof rows)[number]>[] = [
    { id: "business", header: "Business", sort: (a) => a.businessName, cell: (a) => <span className="font-semibold text-olive-950">{a.businessName}</span> },
    { id: "promotion", header: "Promotion", cell: (a) => <span className="block max-w-[20rem]"><span className="block truncate">{a.promotionTitle} · {a.discountText}</span><span className="block truncate text-xs text-muted-foreground">{a.audience}</span></span> },
    { id: "dates", header: "Dates", hideBelow: "md", cell: (a) => <span className="whitespace-nowrap text-sm">{formatDate(a.startDate)}{a.endDate ? ` – ${formatDate(a.endDate)}` : " · ongoing"}</span> },
    { id: "status", header: "Status", cell: (a) => <StatusPill tone={a.currentStatus === "active" ? "good" : a.currentStatus === "scheduled" ? "info" : "neutral"}>{a.currentStatus === "scheduled" ? "Upcoming" : a.currentStatus[0].toUpperCase() + a.currentStatus.slice(1)}</StatusPill> },
    { id: "act", header: "Actions", srOnlyHeader: true, cell: (a) => <Button size="sm" variant="ghost" onClick={() => user && sponsorshipService.cancelPromotion(a.id, user).then(() => toast.success("Promotion assignment cancelled")).catch((e) => toast.error("Couldn't cancel", { description: e instanceof Error ? e.message : undefined }))}><EyeOff /> Cancel</Button> },
  ];
  async function assign() {
    if (!user) return; setSaving(true);
    try { await sponsorshipService.assignPromotion({ businessId, offerId, startDate, endDate: endDate || undefined }, user); toast.success("Promotion assigned"); setBusinessId(""); setOfferId(""); setEndDate(""); }
    catch (e) { toast.error("Couldn't assign the promotion", { description: e instanceof Error ? e.message : undefined }); }
    finally { setSaving(false); }
  }
  return <>
    {user?.role === "admin" ? <div className="mb-6 rounded-lg border bg-card p-5 shadow-card"><h2 className="font-semibold text-olive-950">Assign an existing promotion</h2><p className="mt-1 text-sm text-muted-foreground">Select an existing approved promotion and a business. No new promotion rules are created here.</p><div className="mt-4 grid gap-4 lg:grid-cols-2"><SearchableBusinessSelector value={businessId} onChange={setBusinessId} id="promotion-biz" /><FormField label="Existing promotion" htmlFor="promotion-source" required><NativeSelect id="promotion-source" value={offerId} onChange={(e) => setOfferId(e.target.value)}><option value="">Select a promotion…</option>{offers.filter((o) => o.status !== "inactive" && o.status !== "rejected").map((o) => <option key={o.id} value={o.id}>{o.title} · {o.discountText}</option>)}</NativeSelect></FormField><FormField label="Start date" htmlFor="promotion-start" required><Input id="promotion-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></FormField><FormField label="End date (optional)" htmlFor="promotion-end"><Input id="promotion-end" type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} /></FormField></div><Button className="mt-4" onClick={assign} disabled={saving || !businessId || !offerId}>{saving ? <><Loader2 className="animate-spin" /> Assigning…</> : <><Plus /> Assign promotion</>}</Button></div> : <p className="mb-6 rounded-md border bg-sand-50 p-4 text-sm text-muted-foreground">Only administrators can assign promotions.</p>}
    <DataTable rows={rows} columns={columns} rowKey={(a) => a.id} label="Promotion assignments" defaultSort={{ id: "dates", dir: "desc" }} search={{ placeholder: "Search assignments", text: (a) => `${a.businessName} ${a.promotionTitle} ${a.currentStatus}` }} empty={{ title: "No promotion assignments", description: "Assigned promotions will appear here." }} />
  </>;
}
