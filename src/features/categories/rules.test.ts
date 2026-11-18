import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { categories } from "../../data/categories.ts";
import { businesses } from "../../data/businesses.ts";
import {
  allowedSubcategories, businessInCategory, businessInSubcategory, findDuplicate, isEffectivelyActive, primaryCategories, reorder, subcategoriesOf,
} from "./rules.ts";
import type { Category } from "../../types/index.ts";

const c = (p: Partial<Category> & { id: string }): Category => ({ name: p.id, description: "", icon: "store", image: "", parentId: null, active: true, showInFilters: true, sortOrder: 10, ...p });

describe("categories & subcategories (client update §11)", () => {
  it("seeds primary categories with subcategories in order", () => {
    const prim = primaryCategories(categories);
    assert.ok(prim.length >= 10);
    assert.deepEqual(subcategoriesOf(categories, "food-drink").map((s) => s.name).slice(0, 3), ["Restaurants", "Cafés", "Catering"]);
  });
  it("every business subcategory belongs to one of its categories", () => {
    for (const b of businesses) {
      const allowed = allowedSubcategories(categories, [b.category, ...(b.secondaryCategories ?? [])]).map((s) => s.id);
      for (const sub of b.subcategories ?? []) assert.ok(allowed.includes(sub), `${b.slug}: ${sub}`);
    }
  });
  it("lets a business appear under several categories and subcategories", () => {
    const meridian = businesses.find((b) => b.slug === "meridian-legal-advisory")!;
    assert.ok(businessInCategory(meridian, "professional-services"));
    assert.ok(businessInCategory(meridian, "community-resources"));
    assert.ok(businessInSubcategory(meridian, "sub-legal-aid"));
  });
  it("hides inactive categories, their subcategories, and filter-hidden entries — without touching businesses", () => {
    const all = [c({ id: "a" }), c({ id: "b", active: false }), c({ id: "a1", parentId: "a" }), c({ id: "b1", parentId: "b" }), c({ id: "a2", parentId: "a", showInFilters: false })];
    assert.deepEqual(primaryCategories(all, { activeOnly: true }).map((x) => x.id), ["a"]);
    assert.equal(isEffectivelyActive(all, all[3]), false, "child of an inactive parent");
    assert.deepEqual(subcategoriesOf(all, "a", { activeOnly: true, filtersOnly: true }).map((x) => x.id), ["a1"]);
  });
  it("prevents duplicate names within the same level only", () => {
    assert.ok(findDuplicate(categories, "  food & drink ", null));
    assert.ok(findDuplicate(categories, "cafes", "food-drink"), "accent- and case-insensitive");
    assert.equal(findDuplicate(categories, "Cafés", "technology"), undefined, "same name under another parent is fine");
    assert.equal(findDuplicate(categories, "Food & Drink", null, "food-drink"), undefined, "renaming itself isn't a duplicate");
  });
  it("reorders among siblings", () => {
    const all = [c({ id: "x", sortOrder: 10 }), c({ id: "y", sortOrder: 20 }), c({ id: "z", sortOrder: 30 })];
    const patch = reorder(all, "z", "up");
    const next = all.map((x) => ({ ...x, ...patch.find((p) => p.id === x.id) }));
    assert.deepEqual(primaryCategories(next).map((x) => x.id), ["x", "z", "y"]);
    assert.deepEqual(reorder(all, "x", "up"), [], "already first");
  });
});
