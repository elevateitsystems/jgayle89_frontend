"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FREEBIE_CATEGORIES, FREEBIE_CATEGORY_LABEL } from "@/features/offers/rules";
import { useFreebies } from "@/features/offers/hooks";
import { useSession } from "@/hooks/use-session";
import { formatDate, todayISO } from "@/lib/date";
import { freebieService } from "@/services/offer-service";
import type { Freebie, FreebieCategory } from "@/types";

const schema = z.object({
  title: z.string().trim().min(3, "Add the offer name").max(120),
  company: z.string().trim().min(2, "Add the company or organization").max(120),
  category: z.string().min(1, "Choose a category"),
  summary: z.string().trim().min(10, "Add a short description").max(300),
  eligibility: z.string().trim().min(3, "Add eligibility information").max(300),
  offerDetails: z.string().trim().min(2, "Add the discount amount or offer details").max(120),
  url: z.string().trim().regex(/^https?:\/\/[^\s.]+\.[^\s]+$/i, "Enter the company's website or offer page (https://…)"),
  expiresOn: z.string(),
  active: z.boolean(),
});
type Values = z.infer<typeof schema>;
const empty: Values = { title: "", company: "", category: "", summary: "", eligibility: "", offerDetails: "", url: "", expiresOn: "", active: true };

/** Admin / Staff → Freebies & Discounts (client update §2B "Employee Controls"). Needs "Manage offers & freebies". */
export function FreebiesAdmin() {
  const user = useSession();
  const all = useFreebies();
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Freebie | "new" | null>(null);
  const [toRemove, setToRemove] = useState<Freebie | null>(null);
  const today = todayISO();

  const rows = useMemo(
    () => all.filter((f) => {
      if (category && f.category !== category) return false;
      const expired = !!f.expiresOn && f.expiresOn < today;
      if (status === "active") return f.active && !expired;
      if (status === "inactive") return !f.active;
      if (status === "expired") return expired;
      return true;
    }),
    [all, category, status, today],
  );

  const columns: Column<Freebie>[] = [
    {
      id: "title", header: "Offer", sort: (f) => f.title,
      cell: (f) => <span className="block max-w-[18rem]"><span className="block truncate font-semibold text-olive-950">{f.title}</span><span className="block truncate text-xs text-muted-foreground">{f.company}</span></span>,
    },
    { id: "cat", header: "Category", hideBelow: "md", sort: (f) => f.category, cell: (f) => <span className="text-sm">{FREEBIE_CATEGORY_LABEL[f.category]}</span> },
    { id: "details", header: "Offer details", hideBelow: "lg", cell: (f) => <span className="text-sm">{f.offerDetails}</span> },
    {
      id: "exp", header: "Expires", hideBelow: "sm", sort: (f) => f.expiresOn ?? "9999",
      cell: (f) => !f.expiresOn ? <span className="text-sm text-muted-foreground">No expiry</span> : f.expiresOn < today ? <StatusPill tone="neutral">Expired {formatDate(f.expiresOn)}</StatusPill> : <span className="text-sm">{formatDate(f.expiresOn)}</span>,
    },
    {
      id: "active", header: "Active", sort: (f) => Number(f.active),
      cell: (f) => <Switch checked={f.active} aria-label={`${f.title} active`} onCheckedChange={async (v) => {
        if (!user) return;
        try { await freebieService.update(f.id, { active: v }, user); toast.success(v ? "Listing activated" : "Listing deactivated"); } catch (e) { toast.error("Couldn't update", { description: e instanceof Error ? e.message : undefined }); }
      }} />,
    },
    {
      id: "act", header: "Actions", srOnlyHeader: true,
      cell: (f) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${f.title}`} />}><MoreHorizontal /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setEditing(f)}><Pencil /> Edit</DropdownMenuItem>
            <DropdownMenuItem render={<a href={f.url} target="_blank" rel="noopener noreferrer" />}><ExternalLink /> Open offer page</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setToRemove(f)}><Trash2 /> Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Freebies & Discounts"
        description="Listings in the public Freebies & Discounts directory. Expired and deactivated listings are hidden from the public automatically."
        actions={<Button onClick={() => setEditing("new")}><Plus /> Add listing</Button>}
      />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(f) => f.id}
        label="Freebies and discounts"
        pageSize={10}
        defaultSort={{ id: "exp", dir: "asc" }}
        search={{ placeholder: "Search offers or companies", text: (f) => `${f.title} ${f.company} ${f.summary}` }}
        filters={
          <>
            <NativeSelect aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-52"><option value="">All categories</option>{FREEBIE_CATEGORIES.map((c) => <option key={c} value={c}>{FREEBIE_CATEGORY_LABEL[c]}</option>)}</NativeSelect>
            <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)} className="w-40"><option value="">Any status</option><option value="active">Live</option><option value="inactive">Deactivated</option><option value="expired">Expired</option></NativeSelect>
          </>
        }
        noMatches={{ onClear: () => { setCategory(""); setStatus(""); } }}
        empty={{ title: "No listings yet", description: "Add the first freebie or discount." }}
      />
      <FreebieSheet target={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        destructive
        title="Remove this listing?"
        description={`“${toRemove?.title ?? ""}” will be removed from the directory permanently. To hide it temporarily, deactivate it instead.`}
        confirmLabel="Remove listing"
        busyLabel="Removing…"
        successMessage="Listing removed"
        onConfirm={async () => { if (toRemove && user) await freebieService.remove(toRemove.id, user); }}
      />
    </>
  );
}

function FreebieSheet({ target, onClose }: { target: Freebie | "new" | null; onClose: () => void }) {
  const user = useSession();
  const isNew = target === "new";
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: empty });
  useEffect(() => {
    if (!target) return;
    reset(target === "new" ? empty : { ...target, expiresOn: target.expiresOn ?? "" });
  }, [target, reset]);

  async function onSubmit(v: Values) {
    if (!user || !target) return;
    const input = { ...v, category: v.category as FreebieCategory, expiresOn: v.expiresOn || undefined };
    try {
      if (target === "new") await freebieService.create(input, user);
      else await freebieService.update(target.id, input, user);
      toast.success(isNew ? "Listing added" : "Listing updated");
      onClose();
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-sand-200 p-5">
          <SheetTitle>{isNew ? "Add a freebie or discount" : "Edit listing"}</SheetTitle>
          <SheetDescription>Shown publicly in Freebies &amp; Discounts. Use the company&apos;s own wording and link.</SheetDescription>
        </SheetHeader>
        <form id="freebie-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          <FormField label="Offer name" htmlFor="fb-title" error={errors.title?.message} required><Input id="fb-title" {...register("title")} /></FormField>
          <FormField label="Company or organization" htmlFor="fb-company" error={errors.company?.message} required><Input id="fb-company" {...register("company")} /></FormField>
          <FormField label="Category" htmlFor="fb-cat" error={errors.category?.message} required>
            <NativeSelect id="fb-cat" {...register("category")}><option value="">Select…</option>{FREEBIE_CATEGORIES.map((c) => <option key={c} value={c}>{FREEBIE_CATEGORY_LABEL[c]}</option>)}</NativeSelect>
          </FormField>
          <FormField label="Short description" htmlFor="fb-sum" error={errors.summary?.message} required><Textarea id="fb-sum" rows={3} {...register("summary")} /></FormField>
          <FormField label="Eligibility information" htmlFor="fb-elig" error={errors.eligibility?.message} required><Textarea id="fb-elig" rows={2} {...register("eligibility")} /></FormField>
          <FormField label="Discount amount or offer details" htmlFor="fb-details" error={errors.offerDetails?.message} required hint="e.g. “15% off”, “Free entrée on Veterans Day”"><Input id="fb-details" {...register("offerDetails")} /></FormField>
          <FormField label="Company website or offer page" htmlFor="fb-url" error={errors.url?.message} required><Input id="fb-url" type="url" {...register("url")} /></FormField>
          <FormField label="Expiration date" htmlFor="fb-exp" hint="Optional. Hidden publicly after this date; a countdown shows until then."><Input id="fb-exp" type="date" {...register("expiresOn")} /></FormField>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4 accent-olive-700" {...register("active")} /> Active (visible publicly)</label>
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="freebie-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : isNew ? "Add listing" : "Save changes"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
