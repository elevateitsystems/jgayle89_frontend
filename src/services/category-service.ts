import { categories as seed } from "@/data/categories";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { uniqueSlug } from "@/lib/slug";
import { businessStore } from "@/services/business-service";
import type { Category } from "@/types";

/**
 * Category data-access layer (demo implementation). Admin-only in the UI; the
 * real API must enforce that and reject deleting a category that has listings.
 */
export const categoryStore = createCollectionStore<Category>("categories", seed);

export type CategoryInput = Omit<Category, "id">;

export const categoryService = {
  /** Number of listings (any status) using a category. */
  usageCount(id: string): number {
    return businessStore.getSnapshot().filter((b) => b.category === id).length;
  },

  async create(input: CategoryInput): Promise<Category> {
    await delay(400);
    const all = categoryStore.getSnapshot();
    const category: Category = { ...input, id: uniqueSlug(input.name, all.map((c) => c.id)) };
    categoryStore.set([...all, category]);
    return category;
  },

  /** The id (and therefore every listing's link to it) never changes when renaming. */
  async update(id: string, input: CategoryInput): Promise<Category> {
    await delay(400);
    const all = categoryStore.getSnapshot();
    const current = all.find((c) => c.id === id);
    if (!current) throw new Error("Category not found");
    const next = { ...current, ...input };
    categoryStore.set(all.map((c) => (c.id === id ? next : c)));
    return next;
  },

  async remove(id: string): Promise<void> {
    await delay(300);
    const used = categoryService.usageCount(id);
    if (used > 0) {
      throw new Error(`${used} ${used === 1 ? "listing uses" : "listings use"} this category. Move them to another category first.`);
    }
    categoryStore.set(categoryStore.getSnapshot().filter((c) => c.id !== id));
  },

  reset() {
    categoryStore.reset();
  },
};

