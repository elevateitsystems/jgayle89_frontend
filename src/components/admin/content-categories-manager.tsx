"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAllContentCategories } from "@/hooks/use-content-categories";
import { useSession } from "@/hooks/use-session";
import { contentCategoryService } from "@/services/content-category-service";
import type { ContentCategory, ContentCategoryKind } from "@/types";

export function ContentCategoriesManager({ kind }: { kind: ContentCategoryKind }) {
  const user = useSession();
  const categories = useAllContentCategories(kind);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [editing, setEditing] = useState<ContentCategory | null>(null);
  const [toDelete, setToDelete] = useState<ContentCategory | null>(null);
  const label = kind === "benefit" ? "Benefit" : "Freebie";
  async function run(fn: () => Promise<unknown>, ok: string) { try { await fn(); toast.success(ok); } catch (e) { toast.error("Couldn't update category", { description: e instanceof Error ? e.message : undefined }); } }
  async function save() {
    if (!user || name.trim().length < 2) return toast.error("Enter a category name");
    await run(editing ? () => contentCategoryService.update(kind, editing.id, name, parentId || null, user) : () => contentCategoryService.create({ kind, name, parentId: parentId || null }, user), editing ? "Category updated" : "Category added");
    setName(""); setParentId(""); setEditing(null);
  }
  return <section className="mt-6 rounded-lg border bg-card p-4 shadow-card"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold text-olive-950">{label} categories &amp; subcategories</h2><p className="mt-1 text-xs text-muted-foreground">Manage the public taxonomy and assign entries from the matching admin form.</p></div><Button size="sm" onClick={() => { setEditing(null); setName(""); setParentId(""); }}><Plus /> New category</Button></div><div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder={editing ? "Edit category name" : "New category name"} aria-label={`${label} category name`} /><select value={parentId} onChange={(e) => setParentId(e.target.value)} className="h-10 rounded-md border border-input bg-white px-3 text-sm" aria-label="Parent category"><option value="">Top-level category</option>{categories.filter((c) => !c.parentId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><Button onClick={save}>{editing ? "Save" : "Add"}</Button></div><ul className="mt-4 divide-y divide-sand-200 rounded-md border">{categories.map((c) => <li key={c.id} className="flex items-center gap-3 px-3 py-2.5"><span className="min-w-0 flex-1"><span className="block truncate font-medium">{c.parentId ? "↳ " : ""}{c.name}</span>{c.parentId && <span className="text-xs text-muted-foreground">Subcategory</span>}</span><Switch size="sm" checked={c.active} onCheckedChange={(v) => user && run(() => contentCategoryService.setActive(kind, c.id, v, user), v ? "Category activated" : "Category hidden")} aria-label={`${c.name} active`} /><Button variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`} onClick={() => { setEditing(c); setName(c.name); setParentId(c.parentId ?? ""); }}><Pencil /></Button><Button variant="ghost" size="icon-sm" aria-label={`Delete ${c.name}`} onClick={() => setToDelete(c)}><Trash2 /></Button></li>)}</ul><ConfirmDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} destructive title="Delete this category?" description={`“${toDelete?.name ?? ""}” will be removed from the demo category list.`} confirmLabel="Delete category" busyLabel="Deleting…" successMessage="Category deleted" onConfirm={async () => { if (toDelete && user) await contentCategoryService.remove(kind, toDelete.id, user); }} /></section>;
}
