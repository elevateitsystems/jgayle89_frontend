"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { businessService } from "@/services/business-service";
import type { Business } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/** Search-as-you-type business selector. The demo service is already shaped like a paginated API query. */
export function SearchableBusinessSelector({ value, onChange, id = "business-search", label = "Business" }: { value: string; onChange: (id: string) => void; id?: string; label?: string }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Business[]>([]);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounced = useDebouncedValue(query, 250);

  useEffect(() => {
    let alive = true;
    void businessService.search(debounced, page, 8).then((result) => {
      if (!alive) return;
      setItems(result.items);
      setHasNext(result.hasNext);
    }).finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [debounced, page]);

  const selected = items.find((b) => b.id === value);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-olive-950">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input id={id} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search name, city, state or ZIP…" className="pl-9" aria-describedby={`${id}-help`} />
      </div>
      <p id={`${id}-help`} className="text-xs text-muted-foreground">Search results are loaded a page at a time.</p>
      <div className="rounded-md border bg-white" role="listbox" aria-label={`${label} results`}>
        {loading ? <p className="flex items-center gap-2 p-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Searching…</p> : items.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No businesses found.</p> : items.map((b) => (
          <button type="button" role="option" aria-selected={b.id === value} key={b.id} onClick={() => onChange(b.id)} className={`block w-full border-b px-3 py-2 text-left last:border-0 hover:bg-sand-50 ${b.id === value ? "bg-olive-50" : ""}`}>
            <span className="block text-sm font-semibold text-olive-950">{b.name}</span>
            <span className="block text-xs text-muted-foreground">{b.city}, {b.state} {b.zip} · {b.status === "active" ? "Published" : "Not published"}</span>
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{selected ? `Selected: ${selected.name}` : "Choose a business"}</span>
        <span className="flex gap-1"><Button type="button" size="sm" variant="ghost" disabled={page === 1 || loading} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button type="button" size="sm" variant="ghost" disabled={!hasNext || loading} onClick={() => setPage((p) => p + 1)}>Next</Button></span>
      </div>
    </div>
  );
}
