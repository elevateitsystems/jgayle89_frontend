/**
 * Category & subcategory rules (client update §11). Pure — shared by the directory filters, the business form,
 * the admin manager and the tests. A subcategory is a Category with a `parentId`.
 */
import type { Business, Category } from "../../types/index.ts";

export const isSubcategory = (c: Pick<Category, "parentId">) => !!c.parentId;
const order = (a: Category, b: Category) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name);
const isOn = (c: Category) => c.active !== false;

/** A subcategory is only live if its parent is too. */
export function isEffectivelyActive(all: Category[], c: Category): boolean {
  if (!isOn(c)) return false;
  if (!c.parentId) return true;
  const parent = all.find((p) => p.id === c.parentId);
  return !!parent && isOn(parent);
}

export interface ListOptions {
  /** Only active categories (public site). */
  activeOnly?: boolean;
  /** Only those shown as directory search filters. */
  filtersOnly?: boolean;
}

const passes = (all: Category[], c: Category, o: ListOptions) =>
  (!o.activeOnly || isEffectivelyActive(all, c)) && (!o.filtersOnly || c.showInFilters !== false);

export function primaryCategories(all: Category[], o: ListOptions = {}): Category[] {
  return all.filter((c) => !c.parentId && passes(all, c, o)).sort(order);
}

export function subcategoriesOf(all: Category[], parentId: string, o: ListOptions = {}): Category[] {
  return all.filter((c) => c.parentId === parentId && passes(all, c, o)).sort(order);
}

/** Every primary category a business appears under (its main one first). */
export const categoryIdsFor = (b: Pick<Business, "category" | "secondaryCategories">) => [b.category, ...(b.secondaryCategories ?? []).filter((c) => c !== b.category)];

export const businessInCategory = (b: Pick<Business, "category" | "secondaryCategories">, id: string) => categoryIdsFor(b).includes(id);
export const businessInSubcategory = (b: Pick<Business, "subcategories">, id: string) => (b.subcategories ?? []).includes(id);

const normName = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, " ").trim();

/**
 * Duplicate prevention: names must be unique among primary categories, and among the subcategories of one parent.
 * Returns the existing category with the same name, if any.
 */
export function findDuplicate(all: Category[], name: string, parentId: string | null | undefined, excludeId?: string): Category | undefined {
  const n = normName(name);
  return all.find((c) => c.id !== excludeId && (c.parentId ?? null) === (parentId ?? null) && normName(c.name) === n);
}

/** Swap a category with its neighbour among its siblings. Returns the sortOrder patches to apply. */
export function reorder(all: Category[], id: string, direction: "up" | "down"): { id: string; sortOrder: number }[] {
  const target = all.find((c) => c.id === id);
  if (!target) return [];
  const siblings = all.filter((c) => (c.parentId ?? null) === (target.parentId ?? null)).sort(order);
  const i = siblings.findIndex((c) => c.id === id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (j < 0 || j >= siblings.length) return [];
  // Renumber the whole sibling list so ties can't make the swap a no-op.
  const swapped = [...siblings];
  [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
  return swapped.map((c, k) => ({ id: c.id, sortOrder: (k + 1) * 10 })).filter((p) => all.find((c) => c.id === p.id)?.sortOrder !== p.sortOrder);
}

/** Subcategories a business may use: those under its primary or secondary categories. */
export function allowedSubcategories(all: Category[], categoryIds: string[]): Category[] {
  return all.filter((c) => c.parentId && categoryIds.includes(c.parentId)).sort(order);
}
