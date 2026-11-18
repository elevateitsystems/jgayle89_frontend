"use client";

import { useMemo } from "react";
import { primaryCategories, subcategoriesOf, type ListOptions } from "@/features/categories/rules";
import { categoryStore } from "@/services/category-service";
import { useStore } from "./use-store";
import type { Category } from "@/types";

/**
 * Live category tree (admins can edit it) plus lookup helpers.
 * `categories` = active PRIMARY categories in display order — what every public list and select should use.
 */
export function useCategories() {
  const all = useStore(categoryStore);
  return useMemo(() => {
    const byId = new Map(all.map((c) => [c.id, c]));
    return {
      categories: primaryCategories(all, { activeOnly: true }),
      /** Primary categories including inactive ones (admin forms keep showing a listing's current category). */
      allPrimaries: primaryCategories(all),
      /** Every record, primaries and subcategories. */
      allCategories: all,
      subcategoriesOf: (parentId: string, o: ListOptions = { activeOnly: true }) => subcategoriesOf(all, parentId, o),
      categoryById: (id: string): Category | undefined => byId.get(id),
      categoryName: (id: string): string => byId.get(id)?.name ?? "",
    };
  }, [all]);
}
