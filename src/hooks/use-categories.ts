"use client";

import { useMemo } from "react";
import { categoryStore } from "@/services/category-service";
import { useStore } from "./use-store";
import type { Category } from "@/types";

/** Live category list (admins can edit it) plus lookup helpers. */
export function useCategories() {
  const categories = useStore(categoryStore);
  return useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    return {
      categories,
      categoryById: (id: string): Category | undefined => byId.get(id),
      categoryName: (id: string): string => byId.get(id)?.name ?? "",
    };
  }, [categories]);
}
