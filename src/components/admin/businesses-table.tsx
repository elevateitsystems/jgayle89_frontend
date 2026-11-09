"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, MoreHorizontal, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCategories } from "@/hooks/use-categories";
import { useBusinesses } from "@/hooks/use-businesses";
import { formatDate } from "@/lib/date";
import { businessService } from "@/services/business-service";
import type { Business, ListingStatus } from "@/types";

const PAGE_SIZE = 8;

export function BusinessesTable() {
  const router = useRouter();
  const { businesses, loading } = useBusinesses();
  const { categories, categoryName } = useCategories();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<Business | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return businesses.filter((b) => {
      if (status && b.status !== status) return false;
      if (category && b.category !== category) return false;
      if (!s) return true;
      return `${b.name} ${b.city} ${b.state} ${b.email}`.toLowerCase().includes(s);
    });
  }, [businesses, q, status, category]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const hasFilters = !!(q || status || category);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await businessService.remove(toDelete.id);
      toast.success(`Deleted "${toDelete.name}"`);
      setToDelete(null);
    } catch {
      toast.error("Couldn't delete the business. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function changeStatus(b: Business, next: ListingStatus) {
    await businessService.update(b.id, { status: next });
    toast.success(`${b.name} is now ${next}`);
  }

  return (
    <>
      <PageHeader
        title="Businesses"
        description={`${businesses.length} listings in this demo workspace. Changes are saved to your browser only.`}
        actions={
          <Link href="/admin/businesses/new" className={buttonVariants()}>
            <Plus /> Add business
          </Link>
        }
      />

      <div className="rounded-lg border bg-card shadow-card">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_220px]">
          <label className="relative flex items-center sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search businesses</span>
            <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, city or email"
              className="h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </label>
          <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="draft">Draft</option>
          </NativeSelect>
          <NativeSelect aria-label="Filter by category" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </NativeSelect>
        </div>

        {loading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No businesses found"
              description={hasFilters ? "No listings match these filters." : "Add your first business to get started."}
              actionLabel={hasFilters ? "Clear filters" : undefined}
              onAction={() => { setQ(""); setStatus(""); setCategory(""); }}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Business</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Rating (demo)</TableHead>
                <TableHead className="hidden xl:table-cell">Added</TableHead>
                <TableHead className="w-14 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="pl-4">
                    <Link href={`/admin/businesses/${b.id}/edit`} className="flex min-w-0 items-center gap-3">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-sand-200">
                        <Image src={b.coverImage} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="block max-w-[14rem] truncate font-semibold text-olive-950 hover:underline sm:max-w-xs">{b.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{b.city}, {b.state}</span>
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{categoryName(b.category)}</TableCell>
                  <TableCell><StatusBadge status={b.status} /></TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Star className="size-3.5 fill-brass text-brass" aria-hidden /> {b.rating.toFixed(1)}
                      <span className="text-xs text-muted-foreground">({b.reviewCount})</span>
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(b.createdAt)}</TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${b.name}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => router.push(`/admin/businesses/${b.id}/edit`)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/directory/${b.slug}`)}>
                          <ExternalLink /> View listing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Set status</DropdownMenuLabel>
                          {(["active", "pending", "draft"] as ListingStatus[]).filter((s) => s !== b.status).map((s) => (
                            <DropdownMenuItem key={s} onClick={() => changeStatus(b, s)} className="capitalize">
                              Mark {s}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setToDelete(b)}>
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && filtered.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row">
            <p>
              Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page">
                <ChevronLeft />
              </Button>
              <span className="tabular-nums">Page {safePage} of {pageCount}</span>
              <Button variant="outline" size="icon-sm" disabled={safePage === pageCount} onClick={() => setPage(safePage + 1)} aria-label="Next page">
                <ChevronRight />
              </Button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this business?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{toDelete?.name}</strong> will be removed from the directory. In this demo you can restore it with “Reset demo data”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-white hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete business"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
