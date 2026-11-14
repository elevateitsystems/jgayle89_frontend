"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface Column<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  /** Makes the column sortable. */
  sort?: (row: T) => string | number;
  className?: string;
  /** Hide the column below this breakpoint (the first column should never be hidden). */
  hideBelow?: "sm" | "md" | "lg";
  /** Visually hidden header (action columns). */
  srOnlyHeader?: boolean;
}

const HIDE = { sm: "hidden sm:table-cell", md: "hidden md:table-cell", lg: "hidden lg:table-cell" } as const;

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  /** Accessible name for the table. */
  label: string;
  search?: { placeholder: string; text: (row: T) => string };
  /** Extra controls (selects, chips) rendered next to the search box. */
  filters?: React.ReactNode;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  pageSize?: number;
  defaultSort?: { id: string; dir: "asc" | "desc" };
  empty: { title: string; description?: string; actionLabel?: string; onAction?: () => void };
  /** Shown instead of `empty` when the user's search/filters hide every row. */
  noMatches?: { onClear: () => void };
  className?: string;
}

/** Searchable, sortable, paginated table with loading / empty / error states. Pure UI — data comes from the caller. */
export function DataTable<T>({
  rows, columns, rowKey, label, search, filters, loading, error, onRetry, pageSize = 8, defaultSort, empty, noMatches, className,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState(defaultSort ?? null);
  const [page, setPage] = useState(1);

  const visible = useMemo(() => {
    const needle = q.toLowerCase().trim();
    let out = needle && search ? rows.filter((r) => search.text(r).toLowerCase().includes(needle)) : rows;
    const col = sort && columns.find((c) => c.id === sort.id);
    if (col?.sort) {
      const get = col.sort;
      out = [...out].sort((a, b) => {
        const x = get(a);
        const y = get(b);
        const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
        return sort!.dir === "asc" ? r : -r;
      });
    }
    return out;
  }, [rows, q, sort, columns, search]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = visible.slice((safePage - 1) * pageSize, safePage * pageSize);
  const from = visible.length === 0 ? 0 : (safePage - 1) * pageSize + 1;

  function toggleSort(id: string) {
    setSort((s) => (s?.id === id ? (s.dir === "asc" ? { id, dir: "desc" } : null) : { id, dir: "asc" }));
    setPage(1);
  }

  return (
    <div className={cn("rounded-lg border bg-card shadow-card", className)}>
      {(search || filters) && (
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center">
          {search && (
            <label className="relative flex flex-1 items-center">
              <span className="sr-only">Search {label}</span>
              <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder={search.placeholder}
                className="h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
              />
            </label>
          )}
          {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
        </div>
      )}

      {error ? (
        <div className="p-6">
          <ErrorState onRetry={onRetry} />
        </div>
      ) : loading ? (
        <div className="space-y-3 p-4" aria-busy="true" aria-label={`Loading ${label}`}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="p-6">
          {rows.length > 0 || q ? (
            <EmptyState
              title="Nothing matches"
              description="Try a different search or clear your filters."
              actionLabel="Clear search & filters"
              onAction={() => {
                setQ("");
                noMatches?.onClear();
              }}
            />
          ) : (
            <EmptyState {...empty} />
          )}
        </div>
      ) : (
        <>
          <Table aria-label={label}>
            <TableHeader>
              <TableRow>
                {columns.map((c, i) => {
                  const dir = sort?.id === c.id ? sort.dir : null;
                  return (
                    <TableHead
                      key={c.id}
                      aria-sort={dir ? (dir === "asc" ? "ascending" : "descending") : undefined}
                      className={cn(i === 0 && "pl-4", i === columns.length - 1 && "pr-4", c.hideBelow && HIDE[c.hideBelow], c.className)}
                    >
                      {c.srOnlyHeader ? (
                        <span className="sr-only">{c.header}</span>
                      ) : c.sort ? (
                        <button type="button" onClick={() => toggleSort(c.id)} className="inline-flex items-center gap-1 font-medium hover:text-olive-950">
                          {c.header}
                          {dir === "asc" ? <ArrowUp className="size-3.5" aria-hidden /> : dir === "desc" ? <ArrowDown className="size-3.5" aria-hidden /> : <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />}
                        </button>
                      ) : (
                        c.header
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((c, i) => (
                    <TableCell key={c.id} className={cn(i === 0 && "pl-4", i === columns.length - 1 && "pr-4", c.hideBelow && HIDE[c.hideBelow], c.className)}>
                      {c.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row">
            <p aria-live="polite">
              Showing <span className="font-medium text-foreground">{from}–{Math.min(safePage * pageSize, visible.length)}</span> of{" "}
              <span className="font-medium text-foreground">{visible.length}</span>
            </p>
            {pageCount > 1 && (
              <nav aria-label={`${label} pagination`} className="flex items-center gap-1.5">
                <Button variant="outline" size="icon-sm" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
                  <ChevronLeft />
                </Button>
                <span className="px-2 tabular-nums">Page {safePage} of {pageCount}</span>
                <Button variant="outline" size="icon-sm" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)} aria-label="Next page">
                  <ChevronRight />
                </Button>
              </nav>
            )}
          </div>
        </>
      )}
    </div>
  );
}
