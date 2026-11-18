"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuditLogPanel } from "./audit-log";
import { ImageUpload } from "./image-upload";
import { PageHeader } from "./page-header";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { primaryCategories, subcategoriesOf } from "@/features/categories/rules";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { useSession } from "@/hooks/use-session";
import { CategoryIcon, categoryIconKeys } from "@/lib/category-icons";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { categoryService } from "@/services/category-service";
import type { Category } from "@/types";

const schema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(40, "Keep the name under 40 characters"),
  description: z.string().trim().max(160, "Keep it under 160 characters"),
  icon: z.string(),
  image: z.string(),
  parentId: z.string(),
});
type Values = z.infer<typeof schema>;

type Target = { mode: "edit"; category: Category } | { mode: "new-primary" } | { mode: "new-sub"; parentId: string };

/**
 * Admin → Business Categories (client update §11). Primary categories and their subcategories: create, rename,
 * move, reorder, activate/deactivate and choose which appear as directory filters. Changes update the public
 * filters immediately; deactivating never deletes a business. Who can change what is a grantable permission.
 */
export function CategoriesManager() {
  const user = useSession();
  const { allCategories } = useCategories();
  const { businesses } = useBusinesses();
  const canPrimary = hasPermission(user, "categories.manage");
  const canSub = hasPermission(user, "subcategories.manage");
  const [target, setTarget] = useState<Target | null>(null);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});

  const usage = useMemo(() => {
    const m = new Map<string, number>();
    const bump = (id: string) => m.set(id, (m.get(id) ?? 0) + 1);
    for (const b of businesses) {
      new Set([b.category, ...(b.secondaryCategories ?? []), ...(b.subcategories ?? [])]).forEach(bump);
    }
    return m;
  }, [businesses]);

  const primaries = primaryCategories(allCategories);

  async function run(fn: () => Promise<unknown>, ok?: string) {
    try { await fn(); if (ok) toast.success(ok); } catch (e) { toast.error("Couldn't update", { description: e instanceof Error ? e.message : undefined }); }
  }

  return (
    <>
      <PageHeader
        title="Business categories"
        description="Primary categories and subcategories used by the directory, its search filters and every listing. Deactivating hides a category without removing any business."
        actions={canPrimary ? <Button onClick={() => setTarget({ mode: "new-primary" })}><Plus /> Add category</Button> : undefined}
      />
      {(!canPrimary || !canSub) && (
        <p className="mb-4 rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-sm text-sand-700">
          You can {canPrimary ? "manage primary categories" : canSub ? "manage subcategories" : "view the structure"} only. An administrator can grant {canPrimary ? "subcategory" : "category"} permissions in Staff Management.
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-3">
        <ul className="divide-y divide-sand-200 overflow-hidden rounded-lg border bg-card shadow-card xl:col-span-2" aria-label="Category tree">
          {primaries.map((c, i) => {
            const subs = subcategoriesOf(allCategories, c.id);
            return (
              <li key={c.id}>
                <Row c={c} depth={0} index={i} count={primaries.length} canEdit={canPrimary} canSub={canSub} allCategories={allCategories} usage={usage} run={run} onEdit={setTarget} onDelete={setToDelete} expanded={!!open[c.id]} onToggle={() => setOpen((o) => ({ ...o, [c.id]: !o[c.id] }))} />
                {open[c.id] && (
                  <ul className="divide-y divide-sand-200 border-t border-sand-200" aria-label={`${c.name} subcategories`}>
                    {subs.length === 0 && <li className="bg-sand-50 px-12 py-3 text-sm text-muted-foreground">No subcategories yet.</li>}
                    {subs.map((s, j) => <li key={s.id}><Row c={s} depth={1} index={j} count={subs.length} canEdit={canSub} canSub={canSub} allCategories={allCategories} usage={usage} run={run} onEdit={setTarget} onDelete={setToDelete} expanded={false} onToggle={() => undefined} /></li>)}
                    {canSub && (
                      <li className="bg-sand-50 px-6 py-2 sm:px-12">
                        <Button variant="ghost" size="sm" onClick={() => setTarget({ mode: "new-sub", parentId: c.id })}><Plus /> Add subcategory to {c.name}</Button>
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <AuditLogPanel areas={["categories"]} />
      </div>

      <CategorySheet target={target} onClose={() => setTarget(null)} primaries={primaries} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        destructive
        title={`Delete “${toDelete?.name ?? ""}”?`}
        description={toDelete && (usage.get(toDelete.id) ?? 0) > 0 ? `${usage.get(toDelete.id)} listing(s) use it, so it can't be deleted — deactivate it instead.` : "It will be removed permanently."}
        confirmLabel="Delete"
        busyLabel="Deleting…"
        successMessage="Deleted"
        onConfirm={async () => { if (toDelete && user) await categoryService.remove(toDelete.id, user); }}
      />
    </>
  );
}

function CategorySheet({ target, onClose, primaries }: { target: Target | null; onClose: () => void; primaries: Category[] }) {
  const user = useSession();
  const isSub = target?.mode === "new-sub" || (target?.mode === "edit" && !!target.category.parentId);
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", icon: categoryIconKeys[0], image: "", parentId: "" },
  });

  useEffect(() => {
    if (!target) return;
    if (target.mode === "edit") reset({ name: target.category.name, description: target.category.description, icon: target.category.icon, image: target.category.image, parentId: target.category.parentId ?? "" });
    else reset({ name: "", description: "", icon: categoryIconKeys[0], image: "", parentId: target.mode === "new-sub" ? target.parentId : "" });
  }, [target, reset]);

  async function onSubmit(v: Values) {
    if (!user || !target) return;
    const parent = primaries.find((p) => p.id === v.parentId);
    if (!isSub && !v.image) return toast.error("Add an image for the category");
    // Subcategories inherit their parent's icon and image.
    const input = { name: v.name, description: v.description, icon: isSub ? parent?.icon ?? v.icon : v.icon, image: isSub ? parent?.image ?? v.image : v.image, parentId: isSub ? v.parentId : null };
    try {
      if (target.mode === "edit") await categoryService.update(target.category.id, input, user);
      else await categoryService.create(input, user);
      toast.success(target.mode === "edit" ? "Saved" : isSub ? "Subcategory added" : "Category added", { description: v.name });
      onClose();
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const title = target?.mode === "edit" ? `Edit ${isSub ? "subcategory" : "category"}` : isSub ? "Add subcategory" : "Add category";
  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-sand-200 p-5">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>Names must be unique{isSub ? " within the parent category" : ""}. Changes appear in the directory filters right away.</SheetDescription>
        </SheetHeader>
        <form id="category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          {isSub && (
            <FormField label="Parent category" htmlFor="cat-parent" hint={target?.mode === "edit" ? "Choose another category to move this subcategory." : undefined} required>
              <NativeSelect id="cat-parent" {...register("parentId")}>{primaries.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</NativeSelect>
            </FormField>
          )}
          <FormField label="Name" htmlFor="cat-name" error={errors.name?.message} required>
            <Input id="cat-name" aria-invalid={!!errors.name} aria-describedby={describedBy("cat-name", errors.name?.message)} {...register("name")} />
          </FormField>
          <FormField label="Description" htmlFor="cat-description" error={errors.description?.message}>
            <Input id="cat-description" {...register("description")} />
          </FormField>
          {!isSub && (
            <>
              <FormField label="Icon" htmlFor="cat-icon" required>
                <NativeSelect id="cat-icon" {...register("icon")}>{categoryIconKeys.map((k) => <option key={k} value={k}>{k}</option>)}</NativeSelect>
              </FormField>
              <Controller control={control} name="image" render={({ field }) => <ImageUpload id="cat-image" label="Image *" value={field.value} onChange={field.onChange} />} />
            </>
          )}
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="category-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : "Save"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

interface RowProps {
c: Category;
depth: 0 | 1;
index: number;
count: number;
canEdit: boolean;
canSub: boolean;
allCategories: Category[];
usage: Map<string, number>;
expanded: boolean;
onToggle: () => void;
run: (fn: () => Promise<unknown>, ok?: string) => Promise<void>;
onEdit: (t: Target) => void;
onDelete: (c: Category) => void;
}

function Row({ c, depth, index, count, canEdit, canSub, allCategories, usage, expanded, onToggle, run, onEdit, onDelete }: RowProps) {
const user = useSession();
  const subs = depth === 0 ? subcategoriesOf(allCategories, c.id) : [];
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5", depth === 1 && "bg-sand-50 pl-6 sm:pl-12")}>
      <span className="flex items-center">
        <Button variant="ghost" size="icon-sm" disabled={!canEdit || index === 0} onClick={() => user && run(() => categoryService.move(c.id, "up", user))} aria-label={`Move ${c.name} up`}><ArrowUp /></Button>
        <Button variant="ghost" size="icon-sm" disabled={!canEdit || index === count - 1} onClick={() => user && run(() => categoryService.move(c.id, "down", user))} aria-label={`Move ${c.name} down`}><ArrowDown /></Button>
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {depth === 0 && (
          <button type="button" onClick={onToggle} aria-expanded={expanded} aria-label={`${expanded ? "Collapse" : "Expand"} ${c.name}`} className="rounded p-1 text-olive-700 hover:bg-olive-100">
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        )}
        {depth === 0 && <CategoryIcon name={c.icon} className="size-4 shrink-0 text-olive-600" />}
        <span className="min-w-0">
          <span className={cn("block truncate font-semibold", c.active === false ? "text-muted-foreground line-through" : "text-olive-950")}>{c.name}</span>
          <span className="block text-xs text-muted-foreground">{usage.get(c.id) ?? 0} {(usage.get(c.id) ?? 0) === 1 ? "listing" : "listings"}{depth === 0 ? ` · ${subs.length} ${subs.length === 1 ? "subcategory" : "subcategories"}` : ""}</span>
        </span>
        {c.active === false && <StatusPill tone="neutral">Inactive</StatusPill>}
      </span>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch size="sm" checked={c.active !== false} disabled={!canEdit} onCheckedChange={(v) => user && run(() => categoryService.setActive(c.id, v, user), v ? `${c.name} activated` : `${c.name} deactivated — its listings are kept`)} aria-label={`${c.name} active`} />
        Active
      </label>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <Switch size="sm" checked={c.showInFilters !== false} disabled={!canEdit} onCheckedChange={(v) => user && run(() => categoryService.setShowInFilters(c.id, v, user), v ? "Shown in search filters" : "Hidden from search filters")} aria-label={`${c.name} shown in search filters`} />
        In filters
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`} />}><MoreHorizontal /></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem disabled={!canEdit} onClick={() => onEdit({ mode: "edit", category: c })}><Pencil /> {depth === 1 ? "Edit or move" : "Edit"}</DropdownMenuItem>
          {depth === 0 && <DropdownMenuItem disabled={!canSub} onClick={() => { if (!expanded) onToggle(); onEdit({ mode: "new-sub", parentId: c.id }); }}><Plus /> Add subcategory</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={!canEdit} onClick={() => onDelete(c)}><Trash2 /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
