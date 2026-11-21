export type ContentCategoryKind = "freebie" | "benefit";

export interface ContentCategory {
  id: string;
  kind: ContentCategoryKind;
  name: string;
  parentId?: string | null;
  active: boolean;
  sortOrder: number;
}
