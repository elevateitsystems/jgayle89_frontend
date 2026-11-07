"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, EyeOff, ExternalLink, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EventFormSheet } from "./event-form-sheet";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEvents } from "@/hooks/use-events";
import { formatDate, formatTime, isUpcoming } from "@/lib/date";
import { eventService } from "@/services/event-service";
import type { CommunityEvent } from "@/types";

export function EventsTable() {
  const { events, loading } = useEvents();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<CommunityEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<CommunityEvent | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rows = useMemo(() => {
    const s = q.toLowerCase().trim();
    return events
      .filter((e) => (!status || e.status === status) && (!s || `${e.title} ${e.city} ${e.organizer}`.toLowerCase().includes(s)))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, q, status]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(e: CommunityEvent) {
    setEditing(e);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    await eventService.remove(toDelete.id);
    toast.success(`Deleted "${toDelete.title}"`);
    setDeleting(false);
    setToDelete(null);
  }

  async function togglePublish(e: CommunityEvent) {
    const next = e.status === "published" ? "draft" : "published";
    await eventService.update(e.id, { status: next });
    toast.success(next === "published" ? `"${e.title}" is now published` : `"${e.title}" moved to drafts`);
  }

  return (
    <>
      <PageHeader
        title="Events"
        description="Create, publish and manage community events. Drafts are hidden from the public site."
        actions={
          <Button onClick={openNew}>
            <Plus /> Add event
          </Button>
        }
      />

      <div className="rounded-lg border bg-card shadow-card">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-[1fr_200px]">
          <label className="relative flex items-center">
            <span className="sr-only">Search events</span>
            <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, city or organizer"
              className="h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </label>
          <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
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
              title="No events found"
              description={q || status ? "No events match these filters." : "Create your first event."}
              actionLabel={q || status ? "Clear filters" : "Add event"}
              onAction={q || status ? () => { setQ(""); setStatus(""); } : openNew}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Event</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden md:table-cell">Registered</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-14 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="pl-4">
                    <button type="button" onClick={() => openEdit(e)} className="flex min-w-0 items-center gap-3 text-left">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-sand-200">
                        <Image src={e.image} alt="" fill sizes="44px" className="object-cover" />
                      </span>
                      <span className="min-w-0">
                        <span className="block max-w-[13rem] truncate font-semibold text-olive-950 hover:underline sm:max-w-xs">{e.title}</span>
                        <span className="block text-xs text-muted-foreground sm:hidden">{formatDate(e.date)}</span>
                        <span className="hidden text-xs text-muted-foreground sm:block">{e.category}</span>
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="block">{formatDate(e.date)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(e.startTime)}
                      {!isUpcoming(e.date) && " · past"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{e.city}, {e.state}</TableCell>
                  <TableCell className="hidden tabular-nums md:table-cell">{e.registered} / {e.capacity}</TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${e.title}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => openEdit(e)}>
                          <Pencil /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublish(e)}>
                          {e.status === "published" ? <EyeOff /> : <Eye />}
                          {e.status === "published" ? "Unpublish" : "Publish"}
                        </DropdownMenuItem>
                        <DropdownMenuItem render={<Link href={`/events/${e.slug}`} />}>
                          <ExternalLink /> View event
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setToDelete(e)}>
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
      </div>

      <EventFormSheet open={formOpen} onOpenChange={setFormOpen} event={editing} />

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this event?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{toDelete?.title}</strong> will be removed. In this demo you can restore it with “Reset demo data”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-white hover:bg-destructive/90">
              {deleting ? "Deleting…" : "Delete event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
