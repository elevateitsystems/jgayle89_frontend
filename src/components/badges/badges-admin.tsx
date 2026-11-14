"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { BADGE_ICON_KEYS, BADGE_TONE_KEYS, BadgePill } from "./business-badge";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useBadgeAssignments, useBadges } from "@/features/badges/hooks";
import { useBusinesses } from "@/hooks/use-businesses";
import { useSession } from "@/hooks/use-session";
import { formatDate, todayISO } from "@/lib/date";
import { isAdmin } from "@/lib/permissions";
import { assignBadgeSchema, badgeSchema, revokeSchema, type AssignBadgeValues, type BadgeFormValues } from "@/schemas/badge";
import { badgeService } from "@/services/badge-service";
import type { BadgeAssignment, BusinessBadge } from "@/types";

/** Admin & Staff → Business Badges. Staff assign/revoke; only admins create or edit badge types. */
export function BadgesAdmin() {
  const user = useSession();
  const admin = isAdmin(user);
  return (
    <>
      <PageHeader title={admin ? "Business badges" : "Badge management"} description="Badges are assigned by staff after review. Membership status never grants a badge." />
      <Tabs defaultValue="assignments">
        <TabsList className="mb-4 h-auto p-1">
          <TabsTrigger value="assignments" className="h-9 px-4">Assignments</TabsTrigger>
          <TabsTrigger value="types" className="h-9 px-4">Badge types</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments"><Assignments /></TabsContent>
        <TabsContent value="types"><BadgeTypes canEdit={admin} /></TabsContent>
      </Tabs>
    </>
  );
}

function Assignments() {
  const user = useSession();
  const assignments = useBadgeAssignments();
  const badges = useBadges();
  const { businesses, loading } = useBusinesses();
  const [assigning, setAssigning] = useState(false);
  const [revoking, setRevoking] = useState<BadgeAssignment | null>(null);
  const [filter, setFilter] = useState("");

  const nameOf = (id: string) => businesses.find((b) => b.id === id)?.name ?? id;
  const badgeOf = (id: string) => badges.find((b) => b.id === id);
  const rows = useMemo(() => assignments.filter((a) => !filter || a.badgeId === filter), [assignments, filter]);

  const columns: Column<BadgeAssignment>[] = [
    { id: "biz", header: "Business", sort: (a) => nameOf(a.businessId), cell: (a) => <span className="block max-w-[14rem] truncate font-semibold text-olive-950">{nameOf(a.businessId)}</span> },
    { id: "badge", header: "Badge", sort: (a) => badgeOf(a.badgeId)?.name ?? "", cell: (a) => { const b = badgeOf(a.badgeId); return b ? <BadgePill badge={b} /> : a.badgeId; } },
    { id: "verified", header: "Verified", hideBelow: "md", sort: (a) => a.verifiedOn, cell: (a) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(a.verifiedOn)} · {a.verifiedBy}</span> },
    { id: "status", header: "Status", sort: (a) => a.status, cell: (a) => (a.status === "active" ? <StatusPill tone="good">Active</StatusPill> : <span title={a.revokedReason}><StatusPill tone="bad">Revoked</StatusPill></span>) },
    { id: "act", header: "Actions", srOnlyHeader: true, cell: (a) => a.status === "active" && <Button variant="ghost" size="sm" onClick={() => setRevoking(a)}><ShieldOff /> Revoke</Button> },
  ];

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(a) => a.id}
        label="Badge assignments"
        loading={loading}
        defaultSort={{ id: "verified", dir: "desc" }}
        search={{ placeholder: "Search by business or badge", text: (a) => `${nameOf(a.businessId)} ${badgeOf(a.badgeId)?.name ?? ""}` }}
        filters={
          <>
            <NativeSelect aria-label="Filter by badge" value={filter} onChange={(e) => setFilter(e.target.value)} className="w-52">
              <option value="">All badges</option>
              {badges.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </NativeSelect>
            <Button onClick={() => setAssigning(true)}><Plus /> Assign badge</Button>
          </>
        }
        noMatches={{ onClear: () => setFilter("") }}
        empty={{ title: "No badges assigned", description: "Assign a badge to a business or approve a verification request.", actionLabel: "Assign badge", onAction: () => setAssigning(true) }}
      />
      <AssignDialog open={assigning} onOpenChange={setAssigning} />
      <RevokeDialog key={revoking?.id ?? "none"} assignment={revoking} onClose={() => setRevoking(null)} label={revoking ? `${badgeOf(revoking.badgeId)?.name} from ${nameOf(revoking.businessId)}` : ""} user={user} />
    </>
  );
}

function AssignDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const user = useSession();
  const badges = useBadges().filter((b) => b.active);
  const { businesses } = useBusinesses();
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<AssignBadgeValues>({ resolver: zodResolver(assignBadgeSchema), defaultValues: { businessId: "", badgeId: "", verifiedOn: todayISO() } });
  useEffect(() => { if (open) reset({ businessId: "", badgeId: "", verifiedOn: todayISO() }); }, [open, reset]);

  async function onSubmit(v: AssignBadgeValues) {
    if (!user) return;
    try {
      await badgeService.assign(v.businessId, v.badgeId, v.verifiedOn, user);
      toast.success("Badge assigned");
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't assign the badge", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Assign a badge</DialogTitle><DialogDescription>Only assign after you&apos;ve verified the business yourself or reviewed their documents.</DialogDescription></DialogHeader>
        <form id="assign-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="Business" htmlFor="as-biz" error={errors.businessId?.message} required>
            <NativeSelect id="as-biz" aria-invalid={!!errors.businessId} {...register("businessId")}>
              <option value="">Select a business…</option>
              {[...businesses].sort((a, b) => a.name.localeCompare(b.name)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </NativeSelect>
          </FormField>
          <FormField label="Badge" htmlFor="as-badge" error={errors.badgeId?.message} required>
            <NativeSelect id="as-badge" aria-invalid={!!errors.badgeId} {...register("badgeId")}>
              <option value="">Select a badge…</option>
              {badges.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </NativeSelect>
          </FormField>
          <FormField label="Verification date" htmlFor="as-date" error={errors.verifiedOn?.message} required>
            <Input id="as-date" type="date" max={todayISO()} {...register("verifiedOn")} />
          </FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="assign-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Assigning…</> : "Assign badge"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RevokeDialog({ assignment, onClose, label, user }: { assignment: BadgeAssignment | null; onClose: () => void; label: string; user: ReturnType<typeof useSession> }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Dialog open={!!assignment && !open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Revoke badge</DialogTitle><DialogDescription>Removing {label}. It disappears from the public listing right away.</DialogDescription></DialogHeader>
          <FormField label="Reason" htmlFor="rv-reason" error={error} required hint="Shown to the business owner.">
            <Textarea id="rv-reason" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setError(undefined); }} />
          </FormField>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="destructive" onClick={() => { const r = revokeSchema.safeParse({ reason }); if (!r.success) return setError(r.error.issues[0].message); setOpen(true); }}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => { setOpen(o); if (!o) onClose(); }}
        destructive
        title="Revoke this badge?"
        description={<>This removes <strong>{label}</strong>. The owner can request it again.</>}
        confirmLabel="Revoke badge"
        busyLabel="Revoking…"
        successMessage="Badge revoked"
        onConfirm={async () => { if (assignment && user) await badgeService.revoke(assignment.id, reason, user); }}
      />
    </>
  );
}

function BadgeTypes({ canEdit }: { canEdit: boolean }) {
  const user = useSession();
  const badges = useBadges();
  const [editing, setEditing] = useState<BusinessBadge | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deactivate, setDeactivate] = useState<BusinessBadge | null>(null);
  const assignments = useBadgeAssignments();

  async function setActive(b: BusinessBadge, active: boolean) {
    if (!user) return;
    try {
      await badgeService.update(b.id, { active }, user);
      toast.success(active ? `${b.name} is active` : `${b.name} was deactivated`);
    } catch (e) {
      toast.error("Couldn't update the badge", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const columns: Column<BusinessBadge>[] = [
    { id: "badge", header: "Badge", sort: (b) => b.sortOrder, cell: (b) => <BadgePill badge={b} size="md" /> },
    { id: "desc", header: "Meaning", hideBelow: "md", cell: (b) => <span className="block max-w-sm text-sm text-muted-foreground">{b.description}</span> },
    { id: "docs", header: "Documents", hideBelow: "lg", cell: (b) => (b.requiresDocuments ? "Required" : "Optional") },
    { id: "held", header: "Holders", hideBelow: "sm", sort: (b) => assignments.filter((a) => a.badgeId === b.id && a.status === "active").length, cell: (b) => <span className="tabular-nums">{assignments.filter((a) => a.badgeId === b.id && a.status === "active").length}</span> },
    {
      id: "active", header: "Active", sort: (b) => Number(b.active),
      cell: (b) => canEdit ? <Switch checked={b.active} onCheckedChange={(v) => (v ? setActive(b, true) : setDeactivate(b))} aria-label={`${b.name} active`} /> : <StatusPill tone={b.active ? "good" : "neutral"}>{b.active ? "Active" : "Inactive"}</StatusPill>,
    },
    { id: "edit", header: "Edit", srOnlyHeader: true, cell: (b) => canEdit && <Button variant="ghost" size="icon-sm" aria-label={`Edit ${b.name}`} onClick={() => { setEditing(b); setFormOpen(true); }}><Pencil /></Button> },
  ];

  return (
    <>
      {!canEdit && <p className="mb-3 text-sm text-muted-foreground">Only administrators can create or edit badge types.</p>}
      <DataTable
        rows={badges}
        columns={columns}
        rowKey={(b) => b.id}
        label="Badge types"
        defaultSort={{ id: "badge", dir: "asc" }}
        filters={canEdit ? <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus /> Create badge</Button> : undefined}
        empty={{ title: "No badge types", description: "Create the first badge type." }}
      />
      <BadgeFormSheet open={formOpen} onOpenChange={setFormOpen} badge={editing} />
      <ConfirmDialog
        open={!!deactivate}
        onOpenChange={(o) => !o && setDeactivate(null)}
        destructive
        title="Deactivate this badge?"
        description={<><strong>{deactivate?.name}</strong> will be hidden from public listings and can&apos;t be assigned or requested. Existing assignments are kept and reappear if you reactivate it.</>}
        confirmLabel="Deactivate"
        busyLabel="Deactivating…"
        onConfirm={async () => { if (deactivate) await setActive(deactivate, false); }}
      />
    </>
  );
}

function BadgeFormSheet({ open, onOpenChange, badge }: { open: boolean; onOpenChange: (o: boolean) => void; badge: BusinessBadge | null }) {
  const user = useSession();
  const editing = !!badge;
  const blank: BadgeFormValues = { name: "", description: "", criteria: "", icon: "award", tone: "olive", requiresDocuments: false, active: true };
  const {
    register, control, handleSubmit, reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm<BadgeFormValues>({ resolver: zodResolver(badgeSchema), defaultValues: blank });
  useEffect(() => {
    if (open) reset(badge ? { name: badge.name, description: badge.description, criteria: badge.criteria, icon: badge.icon, tone: badge.tone, requiresDocuments: badge.requiresDocuments, active: badge.active } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, badge, reset]);
  const w = useWatch({ control }) as BadgeFormValues;

  async function onSubmit(v: BadgeFormValues) {
    if (!user) return;
    try {
      if (badge) await badgeService.update(badge.id, v, user);
      else await badgeService.create(v, user);
      toast.success(editing ? "Badge updated" : "Badge created");
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't save the badge", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-sand-200 p-5"><SheetTitle>{editing ? "Edit badge" : "Create badge"}</SheetTitle><SheetDescription>Badge types appear on business cards and profiles once assigned.</SheetDescription></SheetHeader>
        <form id="badge-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="rounded-md border bg-white p-3"><p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Preview</p><BadgePill badge={{ name: w.name || "Badge name", icon: w.icon, tone: w.tone }} size="md" /></div>
          <FormField label="Name" htmlFor="bf-name" error={errors.name?.message} required><Input id="bf-name" aria-invalid={!!errors.name} aria-describedby={describedBy("bf-name", errors.name?.message)} {...register("name")} /></FormField>
          <FormField label="What it means (shown publicly)" htmlFor="bf-desc" error={errors.description?.message} required><Textarea id="bf-desc" rows={3} {...register("description")} /></FormField>
          <FormField label="What staff should check" htmlFor="bf-crit" error={errors.criteria?.message} required><Textarea id="bf-crit" rows={3} {...register("criteria")} /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Icon" htmlFor="bf-icon"><NativeSelect id="bf-icon" {...register("icon")}>{BADGE_ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}</NativeSelect></FormField>
            <FormField label="Colour" htmlFor="bf-tone"><NativeSelect id="bf-tone" {...register("tone")}>{BADGE_TONE_KEYS.map((k) => <option key={k} value={k} className="capitalize">{k}</option>)}</NativeSelect></FormField>
          </div>
          <label className="flex items-center justify-between gap-3 rounded-md border bg-white p-3 text-sm"><span><span className="block font-medium">Requires documents</span><span className="text-xs text-muted-foreground">Owners must attach proof when requesting.</span></span><Switch checked={w.requiresDocuments} onCheckedChange={(v) => setValue("requiresDocuments", v)} /></label>
          <label className="flex items-center justify-between gap-3 rounded-md border bg-white p-3 text-sm"><span><span className="block font-medium">Active</span><span className="text-xs text-muted-foreground">Inactive badges are hidden and can&apos;t be requested.</span></span><Switch checked={w.active} onCheckedChange={(v) => setValue("active", v)} /></label>
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="badge-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : editing ? "Save changes" : "Create badge"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
