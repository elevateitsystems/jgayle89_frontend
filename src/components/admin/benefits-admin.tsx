"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Loader2, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { CategoryBadge, DataStatusBadge, ScopeBadge } from "@/components/benefits/benefit-badges";
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
import { benefitCategories } from "@/data/benefit-categories";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { formatDate } from "@/lib/date";
import { baseBenefits, benefitAdminService, benefitOverrideStore, mergeBenefits, type ManagedBenefit } from "@/services/benefit-admin-service";

const editSchema = z.object({
  title: z.string().trim().min(3, "Add a title").max(120),
  summary: z.string().trim().min(20, "Summary should be at least 20 characters").max(400),
  sourceUrl: z.string().trim().regex(/^https?:\/\/[^\s.]+\.[^\s]+$/i, "Enter the official page URL (https://…)"),
});
type EditValues = z.infer<typeof editSchema>;

/** Admin / Staff → Benefits Management. Publish or hide programs, mark them verified against the official source, and edit wording. */
export function BenefitsAdmin() {
  const user = useSession();
  const overrides = useStore(benefitOverrideStore);
  const managed = useMemo(() => mergeBenefits(baseBenefits, overrides), [overrides]);
  const [category, setCategory] = useState("");
  const [state, setState] = useState<"" | "published" | "hidden" | "unverified">("");
  const [editing, setEditing] = useState<ManagedBenefit | null>(null);

  const rows = useMemo(
    () => managed.filter((m) => (!category || m.benefit.category === category) && (!state || (state === "published" ? m.published : state === "hidden" ? !m.published : m.benefit.dataStatus === "demo"))),
    [managed, category, state],
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
      cell: (m) => <span className="block max-w-[20rem]"><span className="block truncate font-semibold text-olive-950">{m.benefit.title}</span><span className="block truncate text-xs text-muted-foreground">{m.benefit.agency}</span></span>,
    },
    { id: "cat", header: "Category", hideBelow: "md", sort: (m) => m.benefit.category, cell: (m) => <span className="flex flex-wrap gap-1"><CategoryBadge category={m.benefit.category} /><ScopeBadge benefit={m.benefit} /></span> },
    { id: "verified", header: "Source check", hideBelow: "lg", sort: (m) => m.benefit.dataStatus, cell: (m) => <span className="flex flex-col items-start gap-1"><DataStatusBadge status={m.benefit.dataStatus} />{m.benefit.lastVerified && <span className="text-xs text-muted-foreground">{formatDate(m.benefit.lastVerified)}</span>}</span> },
    { id: "pub", header: "Published", sort: (m) => Number(m.published), cell: (m) => <Switch checked={m.published} onCheckedChange={(v) => user && run(() => benefitAdminService.setPublished(m.benefit.id, v, user), v ? "Published" : "Hidden from members")} aria-label={`${m.benefit.title} published`} /> },
    {
      id: "act", header: "Actions", srOnlyHeader: true,
      cell: (m) => (
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${m.benefit.title}`} />}><MoreHorizontal /></DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => setEditing(m)}><Pencil /> Edit wording</DropdownMenuItem>
            <DropdownMenuItem onClick={() => user && run(() => benefitAdminService.markVerified(m.benefit.id, user), "Marked as verified today")}><BadgeCheck /> Mark verified</DropdownMenuItem>
            {m.edited && <><DropdownMenuSeparator /><DropdownMenuItem onClick={() => user && run(() => benefitAdminService.resetEntry(m.benefit.id, user), "Restored the original entry")}><RotateCcw /> Restore original</DropdownMenuItem></>}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Benefits management" description="Control which veteran benefit programs members see, and record when each entry was checked against its official source. Mark an entry verified only after a person has checked it." />
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
            <NativeSelect aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-44"><option value="">All categories</option>{benefitCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</NativeSelect>
            <NativeSelect aria-label="Filter by state" value={state} onChange={(e) => setState(e.target.value as typeof state)} className="w-44"><option value="">Any status</option><option value="published">Published</option><option value="hidden">Hidden</option><option value="unverified">Not yet verified</option></NativeSelect>
          </>
        }
        noMatches={{ onClear: () => { setCategory(""); setState(""); } }}
        empty={{ title: "No benefit programs", description: "The catalogue is empty." }}
      />
      <p className="mt-3 text-xs text-muted-foreground"><StatusPill tone="info">Note</StatusPill> <span className="ml-1">The public Benefits page stays switched off in site settings (phase-gated); members see this catalogue in their dashboard.</span></p>
      <EditSheet managed={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function EditSheet({ managed, onClose }: { managed: ManagedBenefit | null; onClose: () => void }) {
  const user = useSession();
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<EditValues>({ resolver: zodResolver(editSchema), defaultValues: { title: "", summary: "", sourceUrl: "" } });
  useEffect(() => { if (managed) reset({ title: managed.benefit.title, summary: managed.benefit.summary, sourceUrl: managed.benefit.sourceUrl }); }, [managed, reset]);

  async function onSubmit(v: EditValues) {
    if (!managed || !user) return;
    try {
      await benefitAdminService.edit(managed.benefit.id, v, user);
      toast.success("Program updated", { description: "It's marked as not yet verified until someone re-checks the source." });
      onClose();
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Sheet open={!!managed} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-sand-200 p-5"><SheetTitle>Edit program</SheetTitle><SheetDescription>Edits reset the “verified” status so the entry gets re-checked.</SheetDescription></SheetHeader>
        <form id="benefit-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          <FormField label="Title" htmlFor="bn-title" error={errors.title?.message} required><Input id="bn-title" {...register("title")} /></FormField>
          <FormField label="Summary" htmlFor="bn-sum" error={errors.summary?.message} required><Textarea id="bn-sum" rows={5} {...register("summary")} /></FormField>
          <FormField label="Official source URL" htmlFor="bn-url" error={errors.sourceUrl?.message} required><Input id="bn-url" type="url" {...register("sourceUrl")} /></FormField>
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="benefit-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : "Save changes"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
