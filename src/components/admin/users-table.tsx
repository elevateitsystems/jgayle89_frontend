"use client";

import { useMemo, useState } from "react";
import { Ban, CheckCircle2, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/hooks/use-store";
import { formatDate } from "@/lib/date";
import { USER_TYPE_LABEL, isAdmin } from "@/lib/permissions";
import { useSession } from "@/hooks/use-session";
import { userService, userStore } from "@/services/user-service";
import type { AppUser } from "@/types";

/** Registered members (role "user"). Staff and admins are managed on the Staff page. */
export function UsersTable() {
  const all = useStore(userStore);
  const session = useSession();
  const canDelete = isAdmin(session); // staff with "Manage members" can suspend/reactivate but not delete
  const members = useMemo(() => all.filter((u) => u.role === "user"), [all]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [toDelete, setToDelete] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const s = q.toLowerCase().trim();
    return members
      .filter((u) => (!type || u.userType === type) && (!status || u.status === status) && (!s || `${u.name} ${u.email}`.toLowerCase().includes(s)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [members, q, type, status]);

  const counts = useMemo(
    () => ({
      total: members.length,
      veteran: members.filter((u) => u.userType === "veteran").length,
      civilian: members.filter((u) => u.userType === "civilian").length,
      owners: members.filter((u) => u.userType === "business_owner").length,
      suspended: members.filter((u) => u.status === "suspended").length,
    }),
    [members],
  );

  async function toggleStatus(u: AppUser) {
    const next = u.status === "active" ? "suspended" : "active";
    try {
      await userService.setStatus(u.id, next);
      toast.success(next === "suspended" ? `${u.name} was suspended` : `${u.name} was reactivated`);
    } catch (e) {
      toast.error("Couldn't update the user", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setBusy(true);
    try {
      await userService.removeUser(toDelete.id);
      toast.success(`Deleted ${toDelete.name}`);
      setToDelete(null);
    } catch (e) {
      toast.error("Couldn't delete the user", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  const hasFilters = !!(q || type || status);

  return (
    <>
      <PageHeader
        title="Users"
        description={canDelete ? "Registered community members. Veteran / Military, Civilian and Business Owner are account types." : "Registered community members. You can suspend or reactivate accounts; only administrators can delete them."}
      />

      <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ["Registered users", counts.total],
          ["Veteran / Military", counts.veteran],
          ["Civilian", counts.civilian],
          ["Business owners", counts.owners],
          ["Suspended", counts.suspended],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-4 shadow-card">
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-heading text-3xl font-semibold tabular-nums text-olive-950">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-lg border bg-card shadow-card">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-[1fr_180px_160px]">
          <label className="relative flex items-center">
            <span className="sr-only">Search users</span>
            <Search className="pointer-events-none absolute left-3 size-4 text-olive-600" aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email"
              className="h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            />
          </label>
          <NativeSelect aria-label="Filter by account type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All account types</option>
            <option value="veteran">Veteran / Military</option>
            <option value="civilian">Civilian</option>
            <option value="business_owner">Business Owner</option>
          </NativeSelect>
          <NativeSelect aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </NativeSelect>
        </div>

        {rows.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No users found"
              description={hasFilters ? "No users match these filters." : "Nobody has registered yet."}
              actionLabel={hasFilters ? "Clear filters" : undefined}
              onAction={hasFilters ? () => { setQ(""); setType(""); setStatus(""); } : undefined}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">User</TableHead>
                <TableHead className="hidden sm:table-cell">Account type</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-14 pr-4 text-right"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-4">
                    <span className="block max-w-[14rem] truncate font-semibold text-olive-950 sm:max-w-xs">{u.name}</span>
                    <span className="block max-w-[14rem] truncate text-xs text-muted-foreground sm:max-w-xs">{u.email}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground sm:hidden">
                      {u.userType ? USER_TYPE_LABEL[u.userType] : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    {u.userType ? USER_TYPE_LABEL[u.userType] : "—"}
                    {u.branch && <span className="block text-xs text-muted-foreground">{u.branch}</span>}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(u.createdAt)}</TableCell>
                  <TableCell><StatusBadge status={u.status} /></TableCell>
                  <TableCell className="pr-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.name}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => toggleStatus(u)}>
                          {u.status === "active" ? <Ban /> : <CheckCircle2 />}
                          {u.status === "active" ? "Suspend" : "Reactivate"}
                        </DropdownMenuItem>
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onClick={() => setToDelete(u)}>
                              <Trash2 /> Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{toDelete?.name}</strong> ({toDelete?.email}) will be removed. In this demo you can restore them with “Reset demo data”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">
              {busy ? "Deleting…" : "Delete user"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
