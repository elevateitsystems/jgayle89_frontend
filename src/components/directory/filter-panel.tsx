"use client";

import { Briefcase, Star } from "lucide-react";
import { BadgePill } from "@/components/badges/business-badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useBadgeLookup } from "@/features/badges/hooks";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useCategories } from "@/hooks/use-categories";
import { cn } from "@/lib/utils";
import type { BusinessFilters } from "@/lib/business-filters";
import type { BranchOfService } from "@/types";

const branches: BranchOfService[] = ["Army", "Navy", "Marine Corps", "Air Force", "Space Force", "Coast Guard", "National Guard"];

interface Props {
  filters: BusinessFilters;
  counts: Record<string, number>;
  total: number;
  onChange: (patch: Partial<BusinessFilters>) => void;
  idPrefix?: string;
}

export function FilterPanel({ filters, counts, total, onChange, idPrefix = "f" }: Props) {
  const { categories } = useCategories();
  const { badges, counts: badgeCounts } = useBadgeLookup();
  const activeBadges = badges.filter((b) => b.active).sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="space-y-7">
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-olive-700">Category</legend>
        <ul className="space-y-0.5">
          <li>
            <CategoryRow label="All categories" count={total} active={!filters.category} onClick={() => onChange({ category: "" })} />
          </li>
          {categories.map((c) => (
            <li key={c.id}>
              <CategoryRow
                label={c.name}
                count={counts[c.id] ?? 0}
                active={filters.category === c.id}
                onClick={() => onChange({ category: filters.category === c.id ? "" : c.id })}
              />
            </li>
          ))}
        </ul>
      </fieldset>

      {activeBadges.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-olive-700">Badges &amp; verification</legend>
          <ul className="space-y-1">
            {activeBadges.map((b) => {
              const id = `${idPrefix}-badge-${b.id}`;
              const checked = filters.badges.includes(b.id);
              return (
                <li key={b.id}>
                  <label htmlFor={id} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-olive-50">
                    <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange({ badges: c ? [...filters.badges, b.id] : filters.badges.filter((x) => x !== b.id) })} />
                    <BadgePill badge={b} />
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">{badgeCounts[b.id] ?? 0}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">Badges are earned through review. Showing businesses with all selected badges.</p>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-olive-700">Hiring</legend>
        <label htmlFor={`${idPrefix}-hiring`} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-olive-50">
          <Checkbox id={`${idPrefix}-hiring`} checked={filters.hiring} onCheckedChange={(c) => onChange({ hiring: !!c })} />
          <Briefcase className="size-4 text-olive-700" aria-hidden /> Currently hiring
        </label>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-branch`} className="text-xs font-semibold uppercase tracking-[0.14em] text-olive-700">
          Branch of service
        </Label>
        <NativeSelect id={`${idPrefix}-branch`} value={filters.branch} onChange={(e) => onChange({ branch: e.target.value })}>
          <option value="">Any branch</option>
          {branches.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </NativeSelect>
      </div>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-olive-700">Minimum demo rating</legend>
        <div className="flex flex-wrap gap-2">
          {[0, 4, 4.5, 4.8].map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={filters.minRating === r}
              onClick={() => onChange({ minRating: r })}
              className={cn(
                "inline-flex h-10 items-center gap-1 rounded-md border px-3 text-sm font-medium transition-colors",
                filters.minRating === r
                  ? "border-olive-700 bg-olive-700 text-white"
                  : "border-input bg-white text-foreground hover:bg-sand-100",
              )}
            >
              {r === 0 ? (
                "Any"
              ) : (
                <>
                  <Star className="size-3.5 fill-current" aria-hidden /> {r}+
                </>
              )}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function CategoryRow({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex min-h-10 w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
        active ? "bg-olive-700 font-semibold text-white" : "text-foreground hover:bg-olive-100",
      )}
    >
      <span>{label}</span>
      <span className={cn("text-xs tabular-nums", active ? "text-olive-100" : "text-muted-foreground")}>{count}</span>
    </button>
  );
}
