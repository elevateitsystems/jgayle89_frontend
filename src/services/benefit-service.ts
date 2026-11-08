import { benefits } from "@/data/benefits";
import { stateName } from "@/data/us-states";
import { delay } from "@/lib/demo-store";
import {
  buildBenefitIndex,
  countByCategory,
  filterBenefits,
  paginate,
  type BenefitFilters,
} from "@/lib/benefit-filters";
import type { Benefit } from "@/types";

/**
 * Benefits data-access layer (demo implementation over a static dataset).
 *
 * The search index is built once at module load, so each query is a single pass
 * over lowercased strings — no per-keystroke string building and no N+1 lookups.
 * To move to the API, replace these bodies with
 * `GET /api/benefits?q=&state=&category=&page=&pageSize=` calls returning the same shapes;
 * the server should do the filtering/pagination (and `select_related`/`prefetch_related`
 * state + category in Django to avoid N+1 queries).
 */
const index = buildBenefitIndex(benefits, stateName);

/** States that have at least one state-specific program in the dataset. */
export const statesWithPrograms = new Set(benefits.flatMap((b) => (b.state ? [b.state] : [])));

export interface BenefitSearchResult {
  items: Benefit[];
  total: number;
  page: number;
  pageCount: number;
  categoryCounts: Record<string, number>;
}

export function searchBenefits(filters: BenefitFilters, page: number, pageSize: number): BenefitSearchResult {
  const matches = filterBenefits(index, filters);
  const paged = paginate(matches, page, pageSize);
  return {
    items: paged.items,
    total: paged.total,
    page: paged.page,
    pageCount: paged.pageCount,
    categoryCounts: countByCategory(index, filters),
  };
}

export const benefitService = {
  async search(filters: BenefitFilters, page: number, pageSize: number): Promise<BenefitSearchResult> {
    await delay(150);
    return searchBenefits(filters, page, pageSize);
  },

  async getBySlug(slug: string): Promise<Benefit | undefined> {
    await delay(100);
    return benefits.find((b) => b.slug === slug);
  },
};
