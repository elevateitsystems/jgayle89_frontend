"use client";

import { useMemo } from "react";
import { useStore } from "@/hooks/use-store";
import { contentCategoryStore } from "@/services/content-category-service";
import type { ContentCategoryKind } from "@/types";

export function useContentCategories(kind: ContentCategoryKind) {
  const all = useStore(contentCategoryStore);
  return useMemo(() => all.filter((c) => c.kind === kind && c.active && !c.parentId).sort((a, b) => a.sortOrder - b.sortOrder), [all, kind]);
}

export function useAllContentCategories(kind: ContentCategoryKind) {
  const all = useStore(contentCategoryStore);
  return useMemo(() => all.filter((c) => c.kind === kind).sort((a, b) => a.sortOrder - b.sortOrder), [all, kind]);
}
