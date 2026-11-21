import { benefitCategories } from "@/data/benefit-categories";
import { FREEBIE_CATEGORIES, FREEBIE_CATEGORY_LABEL } from "@/features/offers/rules";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { newId } from "@/lib/slug";
import { requirePermission, type Reviewer } from "@/services/actor";
import { auditService } from "@/services/audit-service";
import type { ContentCategory, ContentCategoryKind } from "@/types";

const seed: ContentCategory[] = [
  ...benefitCategories.map((c, i) => ({ id: c.id, kind: "benefit" as const, name: c.name, parentId: null, active: true, sortOrder: i + 1 })),
  ...FREEBIE_CATEGORIES.map((id, i) => ({ id, kind: "freebie" as const, name: FREEBIE_CATEGORY_LABEL[id], parentId: null, active: true, sortOrder: i + 1 })),
];

export const contentCategoryStore = createCollectionStore<ContentCategory>("content-categories", seed);
const permission = (kind: ContentCategoryKind) => kind === "benefit" ? "benefits.manage" : "offers.manage";

export const contentCategoryService = {
  async create(input: Pick<ContentCategory, "kind" | "name" | "parentId">, actor: Reviewer) {
    requirePermission(actor, permission(input.kind), `create ${input.kind} categories`);
    await delay(200);
    const all = contentCategoryStore.getSnapshot();
    const category: ContentCategory = { ...input, id: newId(`${input.kind}-cat`), name: input.name.trim(), parentId: input.parentId ?? null, active: true, sortOrder: Math.max(0, ...all.filter((x) => x.kind === input.kind && (x.parentId ?? null) === (input.parentId ?? null)).map((x) => x.sortOrder)) + 1 };
    contentCategoryStore.set([...all, category]);
    auditService.record(actor, input.kind === "benefit" ? "benefits" : "freebies", "created category", { id: category.id, name: category.name });
    return category;
  },
  async update(kind: ContentCategoryKind, id: string, name: string, parentId: string | null, actor: Reviewer) {
    requirePermission(actor, permission(kind), `edit ${kind} categories`);
    await delay(200);
    contentCategoryStore.set(contentCategoryStore.getSnapshot().map((c) => c.kind === kind && c.id === id ? { ...c, name: name.trim(), parentId } : c));
  },
  async setActive(kind: ContentCategoryKind, id: string, active: boolean, actor: Reviewer) {
    requirePermission(actor, permission(kind), `change ${kind} category status`);
    await delay(150);
    contentCategoryStore.set(contentCategoryStore.getSnapshot().map((c) => c.kind === kind && c.id === id ? { ...c, active } : c));
  },
  async remove(kind: ContentCategoryKind, id: string, actor: Reviewer) {
    requirePermission(actor, permission(kind), `delete ${kind} categories`);
    await delay(200);
    const all = contentCategoryStore.getSnapshot();
    if (all.some((c) => c.kind === kind && c.parentId === id)) throw new Error("Delete or move subcategories first.");
    contentCategoryStore.set(all.filter((c) => !(c.kind === kind && c.id === id)));
  },
};
