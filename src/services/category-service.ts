import { categories as seed } from "@/data/categories";
import { findDuplicate, reorder } from "@/features/categories/rules";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { uniqueSlug } from "@/lib/slug";
import { requirePermission, type Reviewer } from "@/services/actor";
import { auditService } from "@/services/audit-service";
import { businessStore } from "@/services/business-service";
import type { Category, Permission } from "@/types";

/**
 * Category & subcategory data-access layer (demo implementation). Structure changes need
 * `categories.manage` (primaries) or `subcategories.manage` (subcategories) — admin-only unless granted.
 * Every change is written to the audit log. The API must enforce the same rules.
 */
export const categoryStore = createCollectionStore<Category>("categories", seed);

export type CategoryInput = Pick<Category, "name" | "description" | "icon" | "image"> & { parentId?: string | null };

const permFor = (parentId: string | null | undefined): Permission => (parentId ? "subcategories.manage" : "categories.manage");
const kind = (c: { parentId?: string | null }) => (c.parentId ? "subcategory" : "category");

function find(id: string) {
  const c = categoryStore.getSnapshot().find((x) => x.id === id);
  if (!c) throw new Error("Category not found.");
  return c;
}

function patch(id: string, changes: Partial<Category>) {
  categoryStore.set(categoryStore.getSnapshot().map((c) => (c.id === id ? { ...c, ...changes } : c)));
}

export const categoryService = {
  /** Number of listings (any status) using a category or subcategory. */
  usageCount(id: string): number {
    return businessStore.getSnapshot().filter((b) => b.category === id || b.secondaryCategories?.includes(id) || b.subcategories?.includes(id)).length;
  },

  async create(input: CategoryInput, actor: Reviewer): Promise<Category> {
    await delay(400);
    requirePermission(actor, permFor(input.parentId), `create ${kind(input)} entries`);
    const all = categoryStore.getSnapshot();
    const dup = findDuplicate(all, input.name, input.parentId);
    if (dup) throw new Error(`“${dup.name}” already exists${input.parentId ? " in this category" : ""}.`);
    const siblings = all.filter((c) => (c.parentId ?? null) === (input.parentId ?? null));
    const category: Category = {
      ...input,
      parentId: input.parentId ?? null,
      id: uniqueSlug(input.parentId ? `sub-${input.name}` : input.name, all.map((c) => c.id)),
      active: true,
      showInFilters: true,
      sortOrder: Math.max(0, ...siblings.map((c) => c.sortOrder ?? 0)) + 10,
    };
    categoryStore.set([...all, category]);
    auditService.record(actor, "categories", `created ${kind(category)}`, { id: category.id, name: category.name });
    return category;
  },

  /** Rename / edit. For subcategories, changing `parentId` moves it to another primary category. The id never changes. */
  async update(id: string, input: CategoryInput, actor: Reviewer): Promise<Category> {
    await delay(400);
    const current = find(id);
    requirePermission(actor, permFor(current.parentId), `edit ${kind(current)} entries`);
    const parentId = current.parentId ? input.parentId ?? current.parentId : null;
    const dup = findDuplicate(categoryStore.getSnapshot(), input.name, parentId, id);
    if (dup) throw new Error(`“${dup.name}” already exists${parentId ? " in that category" : ""}.`);
    const next = { ...current, ...input, parentId };
    patch(id, next);
    const moved = current.parentId && parentId !== current.parentId;
    const renamed = current.name !== next.name;
    auditService.record(actor, "categories", moved ? "moved subcategory" : renamed ? `renamed ${kind(current)}` : `edited ${kind(current)}`, { id, name: next.name },
      moved ? `${find(current.parentId!).name} → ${find(parentId!).name}` : renamed ? `“${current.name}” → “${next.name}”` : undefined);
    return next;
  },

  /** Deactivating hides it from the site and filters; listings using it are kept untouched. */
  async setActive(id: string, active: boolean, actor: Reviewer) {
    await delay(250);
    const current = find(id);
    requirePermission(actor, permFor(current.parentId), `change ${kind(current)} status`);
    patch(id, { active });
    auditService.record(actor, "categories", active ? `activated ${kind(current)}` : `deactivated ${kind(current)}`, { id, name: current.name });
  },

  async setShowInFilters(id: string, showInFilters: boolean, actor: Reviewer) {
    await delay(250);
    const current = find(id);
    requirePermission(actor, permFor(current.parentId), "change search filters");
    patch(id, { showInFilters });
    auditService.record(actor, "categories", showInFilters ? "shown in filters" : "hidden from filters", { id, name: current.name });
  },

  async move(id: string, direction: "up" | "down", actor: Reviewer) {
    await delay(150);
    const current = find(id);
    requirePermission(actor, permFor(current.parentId), "reorder categories");
    const patches = reorder(categoryStore.getSnapshot(), id, direction);
    if (patches.length === 0) return;
    categoryStore.set(categoryStore.getSnapshot().map((c) => ({ ...c, ...patches.find((p) => p.id === c.id) })));
    auditService.record(actor, "categories", `moved ${direction}`, { id, name: current.name });
  },

  async remove(id: string, actor: Reviewer): Promise<void> {
    await delay(300);
    const current = find(id);
    requirePermission(actor, permFor(current.parentId), `delete ${kind(current)} entries`);
    const used = categoryService.usageCount(id);
    if (used > 0) throw new Error(`${used} ${used === 1 ? "listing uses" : "listings use"} it. Deactivate it instead, or move those listings first.`);
    const children = categoryStore.getSnapshot().filter((c) => c.parentId === id);
    if (children.length > 0) throw new Error("Move or delete its subcategories first.");
    categoryStore.set(categoryStore.getSnapshot().filter((c) => c.id !== id));
    auditService.record(actor, "categories", `deleted ${kind(current)}`, { id, name: current.name });
  },

  reset() {
    categoryStore.reset();
  },
};
