import type { Benefit } from "@/types";

/**
 * Pure search/filter logic for veteran benefits. It has no runtime imports so it
 * can be unit-tested directly with `node --test`.
 *
 * Federal benefits (state === null) match EVERY state filter; state programs match
 * only their own state. With no state selected, everything is returned.
 */
export interface BenefitFilters {
  q: string;
  state: string; // 2-letter code, "" = all
  category: string; // BenefitCategory id, "" = all
}

export const defaultBenefitFilters: BenefitFilters = { q: "", state: "", category: "" };

export interface BenefitIndexEntry {
  benefit: Benefit;
  title: string;
  tags: string;
  body: string;
}

const norm = (s: string) => s.toLowerCase().trim();

/** Lower-cases the searchable text once so each keystroke only does substring checks. */
export function buildBenefitIndex(list: Benefit[], getStateName: (code: string) => string): BenefitIndexEntry[] {
  return list.map((benefit) => ({
    benefit,
    title: norm(benefit.title),
    tags: norm(benefit.tags.join(" ")),
    body: norm(
      [
        benefit.summary,
        benefit.description,
        benefit.agency,
        benefit.eligibility.join(" "),
        benefit.howToApply.join(" "),
        benefit.state ? `${benefit.state} ${getStateName(benefit.state)}` : "federal nationwide",
      ].join(" "),
    ),
  }));
}

function matchesState(b: Benefit, state: string) {
  return !state || b.state === null || b.state === state;
}

export function filterBenefits(index: BenefitIndexEntry[], f: BenefitFilters): Benefit[] {
  const tokens = norm(f.q).split(/\s+/).filter(Boolean);
  const scored: { benefit: Benefit; score: number }[] = [];

  for (const e of index) {
    const b = e.benefit;
    if (f.category && b.category !== f.category) continue;
    if (!matchesState(b, f.state)) continue;

    let score = 0;
    let ok = true;
    for (const t of tokens) {
      if (e.title.includes(t)) score += 3;
      else if (e.tags.includes(t)) score += 2;
      else if (e.body.includes(t)) score += 1;
      else {
        ok = false;
        break;
      }
    }
    if (ok) scored.push({ benefit: b, score });
  }

  scored.sort((a, c) => {
    if (c.score !== a.score) return c.score - a.score;
    // With a state selected, surface that state's own programs before federal ones.
    if (f.state) {
      const aState = a.benefit.state === f.state ? 0 : 1;
      const cState = c.benefit.state === f.state ? 0 : 1;
      if (aState !== cState) return aState - cState;
    }
    return a.benefit.title.localeCompare(c.benefit.title);
  });
  return scored.map((s) => s.benefit);
}

/** Per-category counts that respect keyword + state but ignore the category filter itself. */
export function countByCategory(index: BenefitIndexEntry[], f: BenefitFilters): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const b of filterBenefits(index, { ...f, category: "" })) {
    counts[b.category] = (counts[b.category] ?? 0) + 1;
  }
  return counts;
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    items: items.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pageCount,
    total: items.length,
  };
}
