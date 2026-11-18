"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Loader2, MoreHorizontal, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { CategoryBadge, DataStatusBadge, ScopeBadge } from "@/components/benefits/benefit-badges";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { benefitAudiences, benefitCategories } from "@/data/benefit-categories";
import { US_STATES } from "@/data/us-states";
import { useManagedBenefits } from "@/features/benefits/hooks";
import { useSession } from "@/hooks/use-session";
import { formatDate, todayISO } from "@/lib/date";
import { benefitAdminService, type ManagedBenefit } from "@/services/benefit-admin-service";
import type { BenefitAudience, BenefitCategory } from "@/types";

const url = z.string().trim().regex(/^https?:\/\/[^\s.]+\.[^\s]+$/i, "Enter the official page URL (https://…)");
const formSchema = z.object({
  title: z.string().trim().min(3, "Add a title").max(120),
  agency: z.string().trim().min(2, "Add the agency or organization").max(120),
  summary: z.string().trim().min(20, "Summary should be at least 20 characters").max(400),
  description: z.string().trim().max(2000),
  eligibility: z.string().trim().max(1500),
  category: z.string().min(1, "Choose a category"),
  audiences: z.array(z.string()).min(1, "Choose at least one military background"),
  state: z.string(),
  sourceUrl: url,
  applyUrl: z.union([z.literal(""), url]),
  expiresOn: z.string(),
});
type FormValues = z.infer<typeof formSchema>;

const empty: FormValues = { title: "", agency: "", summary: "", description: "", eligibility: "", category: "", audiences: ["veterans"], state: "", sourceUrl: "", applyUrl: "", expiresOn: "" };

/**
 * Admin / Staff → Benefits Management. Add programs, edit descriptions and links, categorise them, set end dates,
 * publish/hide them and remove outdated ones. Mark an entry verified only after a person checked the official source.
 */
export function BenefitsAdmin() {
  const user = useSession();
  const managed = useManagedBenefits();
  const [category, setCategory] = useState("");
  const [state, setState] = useState<"" | "published" | "hidden" | "unverified" | "expired">("");
  const [editing, setEditing] = useState<ManagedBenefit | "new" | null>(null);
  const [toRemove, setToRemove] = useState<ManagedBenefit | null>(null);
  const today = todayISO();

  const rows = useMemo(
    () =>
      managed.filter((m) => {
        if (category && m.benefit.category !== category) return false;
        if (state === "published") return m.published;
        if (state === "hidden") return !m.published;
        if (state === "unverified") return m.benefit.dataStatus === "demo";
        if (state === "expired") return !!m.benefit.expiresOn && m.benefit.expiresOn < today;
        return true;
      }),
    [managed, category, state, today],
  );

  async function run(fn: () => Promise<void>, ok: string) {
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error("Couldn't update the benefit", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const columns: Column<ManagedBenefit>[] = [
    {
      id: "title", header: "Program", sort: (m) => m.benefit.title,
      cell: (m) => (
        <span className="block max-w-[20rem]">
          <span className="block truncate font-semibold text-olive-950">{m.benefit.title}</span>
          <span className="block truncate text-xs text-muted-foreground">{m.benefit.agency}{m.custom && " · added by staff"}</span>
        </span>
      ),
    },
    { id: "cat", header: "Category", hideBelow: "md", sort: (m) => m.benefit.category, cell: (m) => <span className="flex flex-wrap gap-1"><CategoryBadge category={m.benefit.category} /><ScopeBadge benefit={m.benefit} /></span> },
    {
      id: "verified", header: "Source check", hideBelow: "lg", sort: (m) => m.benefit.dataStatus,
      cell: (m) => (
        <span className="flex flex-col items-start gap-1">
          <DataStatusBadge status={m.benefit.dataStatus} />
          {m.benefit.lastVerified && <span className="text-xs text-muted-foreground">{formatDate(m.benefit.lastVerified)}</span>}
          {m.benefit.expiresOn && (
            <StatusPill tone={m.benefit.expiresOn < today ? "bad" : "neutral"}>{m.benefit.expiresOn < today ? "Expired" : "Ends"} {formatDate(m.benefit.expiresOn)}</StatusPill>
          )}
        </span>
      ),
    },
    { id: "pub", header: "Active", sort: (m) => Number(m.published), cell: (m) => <Switch checked={m.published} onCheckedChange={(v) => user && run(() => benefitAdminService.setPublished(m.benefit.id, v, user), v ? "Activated — visible publicly" : "Deactivated — hidden from the public")} aria-label={`${m.benefit.title} active`} /> },
    {
      id: "act", header: "Actions", srOnlyHeader: true,
      cell: (m) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.benefit.title}`} />}><MoreHorizontal /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setEditing(m)}><Pencil /> Edit program</DropdownMenuItem>
            <DropdownMenuItem onClick={() => user && run(() => benefitAdminService.markVerified(m.benefit.id, user), "Marked as verified today")}><BadgeCheck /> Mark verified</DropdownMenuItem>
            {m.edited && !m.custom && <DropdownMenuItem onClick={() => user && run(() => benefitAdminService.resetEntry(m.benefit.id, user), "Restored the original entry")}><RotateCcw /> Restore original</DropdownMenuItem>}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => setToRemove(m)}><Trash2 /> Remove</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Benefits management"
        description="Add, edit, categorise and remove programs in the public Benefits Directory. Mark an entry verified only after a person has checked it against the official source."
        actions={<Button onClick={() => setEditing("new")}><Plus /> Add program</Button>}
      />
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(m) => m.benefit.id}
        label="Benefit programs"
        pageSize={10}
        defaultSort={{ id: "title", dir: "asc" }}
        search={{ placeholder: "Search programs", text: (m) => `${m.benefit.title} ${m.benefit.agency} ${m.benefit.tags.join(" ")}` }}
        filters={
          <>
            <NativeSelect aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-48"><option value="">All categories</option>{benefitCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect>
            <NativeSelect aria-label="Filter by status" value={state} onChange={(e) => setState(e.target.value as typeof state)} className="w-44">
              <option value="">Any status</option><option value="published">Active</option><option value="hidden">Inactive</option><option value="unverified">Not yet verified</option><option value="expired">Expired</option>
            </NativeSelect>
          </>
        }
        noMatches={{ onClear: () => { setCategory(""); setState(""); } }}
        empty={{ title: "No benefit programs", description: "Add a program to get started." }}
      />
      <BenefitSheet target={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        destructive
        title="Remove this program?"
        description={`“${toRemove?.benefit.title ?? ""}” will be removed from the directory and the member dashboard.`}
        confirmLabel="Remove program"
        busyLabel="Removing…"
        successMessage="Program removed"
        onConfirm={async () => { if (toRemove && user) await benefitAdminService.remove(toRemove.benefit.id, user); }}
      />
    </>
  );
}

function BenefitSheet({ target, onClose }: { target: ManagedBenefit | "new" | null; onClose: () => void }) {
  const user = useSession();
  const isNew = target === "new";
  const managed = target && target !== "new" ? target : null;
  const {
    register, handleSubmit, reset, control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: empty });

  useEffect(() => {
    if (!target) return;
    if (target === "new") return reset(empty);
    const b = target.benefit;
    reset({
      title: b.title, agency: b.agency, summary: b.summary, description: b.description, eligibility: b.eligibility.join("\n"),
      category: b.category, audiences: b.audiences ?? ["veterans"], state: b.state ?? "", sourceUrl: b.sourceUrl, applyUrl: b.applyUrl ?? "", expiresOn: b.expiresOn ?? "",
    });
  }, [target, reset]);

  async function onSubmit(v: FormValues) {
    if (!user || !target) return;
    const input = {
      ...v,
      category: v.category as BenefitCategory,
      audiences: v.audiences as BenefitAudience[],
      eligibility: v.eligibility.split("\n").map((l) => l.trim()).filter(Boolean),
      expiresOn: v.expiresOn || undefined,
      applyUrl: v.applyUrl || undefined,
    };
    try {
      if (isNew) await benefitAdminService.create(input, user);
      else if (managed) await benefitAdminService.edit(managed.benefit.id, input, user);
      toast.success(isNew ? "Program added" : "Program updated", { description: "It's marked as not yet verified until someone checks the official source." });
      onClose();
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-sand-200 p-5">
          <SheetTitle>{isNew ? "Add program" : "Edit program"}</SheetTitle>
          <SheetDescription>Use wording and links from the official source only. Saving resets the “verified” status.</SheetDescription>
        </SheetHeader>
        <form id="benefit-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          <FormField label="Program name" htmlFor="bn-title" error={errors.title?.message} required><Input id="bn-title" {...register("title")} /></FormField>
          <FormField label="Agency or organization" htmlFor="bn-agency" error={errors.agency?.message} required><Input id="bn-agency" disabled={!isNew} {...register("agency")} /></FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Category" htmlFor="bn-cat" error={errors.category?.message} required>
              <NativeSelect id="bn-cat" {...register("category")}><option value="">Select…</option>{benefitCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect>
            </FormField>
            <FormField label="Availability" htmlFor="bn-state" hint={isNew ? undefined : "Set when the program is created."}>
              <NativeSelect id="bn-state" disabled={!isNew} {...register("state")}><option value="">Federal — all states</option>{US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name} only</option>)}</NativeSelect>
            </FormField>
          </div>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-olive-950">Military background <span className="text-destructive" aria-hidden>*</span></legend>
            <Controller
              control={control}
              name="audiences"
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {benefitAudiences.map((a) => (
                    <label key={a.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={field.value.includes(a.id)} onCheckedChange={(c) => field.onChange(c ? [...field.value, a.id] : field.value.filter((x) => x !== a.id))} />
                      {a.name}
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.audiences && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.audiences.message}</p>}
          </fieldset>
          <FormField label="Brief description" htmlFor="bn-sum" error={errors.summary?.message} required><Textarea id="bn-sum" rows={3} {...register("summary")} /></FormField>
          <FormField label="Full description" htmlFor="bn-desc" error={errors.description?.message}><Textarea id="bn-desc" rows={4} {...register("description")} /></FormField>
          <FormField label="Basic eligibility" htmlFor="bn-elig" hint="One point per line. Summarise the official criteria — never invent them." error={errors.eligibility?.message}><Textarea id="bn-elig" rows={3} {...register("eligibility")} /></FormField>
          <FormField label="Official website" htmlFor="bn-url" error={errors.sourceUrl?.message} required><Input id="bn-url" type="url" {...register("sourceUrl")} /></FormField>
          <FormField label="Official application link" htmlFor="bn-apply" error={errors.applyUrl?.message} hint="Optional — when it differs from the website."><Input id="bn-apply" type="url" {...register("applyUrl")} /></FormField>
          <FormField label="End date" htmlFor="bn-exp" hint="Optional. The program is hidden publicly after this date."><Input id="bn-exp" type="date" {...register("expiresOn")} /></FormField>
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="benefit-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : isNew ? "Add program" : "Save changes"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
