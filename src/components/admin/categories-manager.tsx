"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";
import { PageHeader } from "./page-header";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBusinesses } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { CategoryIcon, categoryIconKeys } from "@/lib/category-icons";
import { categorySchema, type CategoryFormValues } from "@/schemas/category";
import { categoryService } from "@/services/category-service";
import type { Category } from "@/types";

const emptyValues: CategoryFormValues = { name: "", description: "", icon: categoryIconKeys[0], image: "" };

export function CategoriesManager() {
  const { categories } = useCategories();
  const { businesses } = useBusinesses();
  const [editing, setEditing] = useState<Category | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // One pass over listings instead of a count per row.
  const usage = useMemo(() => {
    const m = new Map<string, number>();
    businesses.forEach((b) => m.set(b.category, (m.get(b.category) ?? 0) + 1));
    return m;
  }, [businesses]);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await categoryService.remove(toDelete.id);
      toast.success(`Deleted "${toDelete.name}"`);
      setToDelete(null);
    } catch (e) {
      toast.error("Can't delete this category", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description="Business categories used by the directory, filters and listings. Renaming a category updates every listing that uses it."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> Add category
          </Button>
        }
      />

      <div className="rounded-lg border bg-card shadow-card">
        {categories.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No categories yet" description="Add a category so businesses can be organised." actionLabel="Add category" onAction={() => setFormOpen(true)} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Category</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-right">Listings</TableHead>
                <TableHead className="w-14 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => {
                const count = usage.get(c.id) ?? 0;
                return (
                  <TableRow key={c.id}>
                    <TableCell className="pl-4">
                      <div className="flex items-center gap-3">
                        <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-sand-200">
                          <Image src={c.image} alt="" fill sizes="44px" className="object-cover" unoptimized={c.image.startsWith("data:")} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5 font-semibold text-olive-950">
                            <CategoryIcon name={c.icon} className="size-4 text-olive-600" /> {c.name}
                          </span>
                          <span className="block max-w-[14rem] truncate text-xs text-muted-foreground md:hidden">{c.description}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-sm text-muted-foreground md:table-cell">{c.description}</TableCell>
                    <TableCell className="text-right tabular-nums">{count}</TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`} />}>
                          <MoreHorizontal />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => { setEditing(c); setFormOpen(true); }}>
                            <Pencil /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setToDelete(c)}>
                            <Trash2 /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <CategoryFormSheet open={formOpen} onOpenChange={setFormOpen} category={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{toDelete?.name}</strong> will be removed.
              {toDelete && (usage.get(toDelete.id) ?? 0) > 0
                ? ` ${usage.get(toDelete.id)} listing(s) still use it, so deletion will be blocked until they are moved.`
                : " No listings use it."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-white hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function CategoryFormSheet({ open, onOpenChange, category }: { open: boolean; onOpenChange: (o: boolean) => void; category: Category | null }) {
  const editing = !!category;
  const {
    register, control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema), defaultValues: emptyValues });

  useEffect(() => {
    if (open) reset(category ? { name: category.name, description: category.description, icon: category.icon, image: category.image } : emptyValues);
  }, [open, category, reset]);

  async function onSubmit(v: CategoryFormValues) {
    try {
      if (category) await categoryService.update(category.id, v);
      else await categoryService.create(v);
      toast.success(editing ? "Category updated" : "Category added", { description: v.name });
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't save the category", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-sand-200 p-5">
          <SheetTitle>{editing ? "Edit category" : "Add category"}</SheetTitle>
          <SheetDescription>Shown in the directory filters, homepage and business forms.</SheetDescription>
        </SheetHeader>
        <form id="category-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          <FormField label="Name" htmlFor="cat-name" error={errors.name?.message} required>
            <Input id="cat-name" aria-invalid={!!errors.name} aria-describedby={describedBy("cat-name", errors.name?.message)} {...register("name")} />
          </FormField>
          <FormField label="Description" htmlFor="cat-description" error={errors.description?.message} required>
            <Input id="cat-description" aria-invalid={!!errors.description} aria-describedby={describedBy("cat-description", errors.description?.message)} {...register("description")} />
          </FormField>
          <FormField label="Icon" htmlFor="cat-icon" error={errors.icon?.message} required>
            <NativeSelect id="cat-icon" {...register("icon")}>
              {categoryIconKeys.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </NativeSelect>
          </FormField>
          <Controller
            control={control}
            name="image"
            render={({ field }) => <ImageUpload id="cat-image" label="Image *" value={field.value} onChange={field.onChange} error={errors.image?.message} />}
          />
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="category-form" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : editing ? "Save changes" : "Add category"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
