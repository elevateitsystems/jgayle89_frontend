import type { Business, CommunityEvent } from "@/types";

export interface BusinessFilters {
  q: string;
  location: string;
  category: string; // "" = all
  branch: string; // "" = all
  minRating: number; // 0 = any
  sort: "featured" | "rating" | "name" | "newest";
}

export const defaultFilters: BusinessFilters = {
  q: "",
  location: "",
  category: "",
  branch: "",
  minRating: 0,
  sort: "featured",
};

const norm = (s: string) => s.toLowerCase().trim();

export function filterBusinesses(
  list: Business[],
  f: BusinessFilters,
  /** Resolves a category id to its display name so keyword search matches category names. */
  categoryName: (id: string) => string = () => "",
): Business[] {
  const q = norm(f.q);
  const loc = norm(f.location);
  const out = list.filter((b) => {
    if (f.category && b.category !== f.category) return false;
    if (f.branch && b.branch !== f.branch) return false;
    if (f.minRating && b.rating < f.minRating) return false;
    if (loc) {
      const hay = norm(`${b.city} ${b.state} ${b.zip} ${b.address}`);
      if (!loc.split(/[\s,]+/).filter(Boolean).every((t) => hay.includes(t))) return false;
    }
    if (q) {
      const hay = norm(
        [b.name, b.tagline, b.description, b.services.join(" "), b.keywords.join(" "), categoryName(b.category)].join(" "),
      );
      if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
    }
    return true;
  });

  const sorted = [...out];
  switch (f.sort) {
    case "rating":
      sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "newest":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    default:
      sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
  }
  return sorted;
}

export function activeFilterCount(f: BusinessFilters) {
  return [f.q, f.location, f.category, f.branch, f.minRating ? "r" : ""].filter(Boolean).length;
}

export function filterEvents(
  list: CommunityEvent[],
  { q, category }: { q: string; category: string },
) {
  const s = norm(q);
  return list.filter((e) => {
    if (category && e.category !== category) return false;
    if (!s) return true;
    return norm(`${e.title} ${e.summary} ${e.city} ${e.state} ${e.venue} ${e.organizer}`).includes(s);
  });
}
