"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, CheckCircle2, Loader2, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore } from "@/hooks/use-store";
import { STAFF_PERMISSIONS } from "@/lib/permissions";
import { staffSchema, type StaffFormValues } from "@/schemas/staff";
import { userService, userStore } from "@/services/user-service";
import type { AppUser } from "@/types";

const permissionLabel = (id: string) => STAFF_PERMISSIONS.find((p) => p.id === id)?.label ?? id;

export function StaffManager() {
  const all = useStore(userStore);
  const admins = useMemo(() => all.filter((u) => u.role === "admin"), [all]);
  const staff = useMemo(() => all.filter((u) => u.role === "staff").sort((a, b) => a.name.localeCompare(b.name)), [all]);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toRemove, setToRemove] = useState<AppUser | null>(null);
  const [busy, setBusy] = useState(false);

  async function toggleStatus(u: AppUser) {
    const next = u.status === "active" ? "suspended" : "active";
    try {
      await userService.setStatus(u.id, next);
      toast.success(next === "suspended" ? `${u.name}'s staff access is suspended` : `${u.name}'s staff access is restored`);
    } catch (e) {
      toast.error("Couldn't update the staff member", { description: e instanceof Error ? e.message : undefined });
    }
  }

  async function confirmRemove() {
    if (!toRemove) return;
    setBusy(true);
    try {
      await userService.removeUser(toRemove.id);
      toast.success(`Removed ${toRemove.name}`);
      setToRemove(null);
    } catch (e) {
      toast.error("Couldn't remove the staff member", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Staff & permissions"
        description="Staff only see the dashboard sections their permissions allow. Administrators always have full access."
        actions={
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus /> Add staff
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <section aria-label="Staff members" className="space-y-3 xl:col-span-2">
          {staff.length === 0 ? (
            <EmptyState title="No staff yet" description="Add a staff member and choose what they can manage." actionLabel="Add staff" onAction={() => setFormOpen(true)} />
          ) : (
            <ul className="space-y-3">
              {staff.map((u) => (
                <li key={u.id} className="rounded-lg border bg-card p-4 shadow-card sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-olive-600 text-sm font-semibold text-white" aria-hidden>
                      {u.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-olive-950">{u.name}</p>
                        <StatusBadge status={u.status} />
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                      <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={`Permissions for ${u.name}`}>
                        {u.permissions.length === 0 ? (
                          <li className="text-xs text-muted-foreground">No permissions assigned</li>
                        ) : (
                          u.permissions.map((p) => (
                            <li key={p} className="rounded-full bg-olive-100 px-2.5 py-1 text-xs font-medium text-olive-900">
                              {permissionLabel(p)}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.name}`} />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => { setEditing(u); setFormOpen(true); }}>
                          <Pencil /> Edit permissions
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(u)}>
                          {u.status === "active" ? <Ban /> : <CheckCircle2 />}
                          {u.status === "active" ? "Suspend access" : "Restore access"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => setToRemove(u)}>
                          <Trash2 /> Remove staff
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-sans text-base font-semibold text-olive-950">
              <ShieldCheck className="size-4 text-olive-600" aria-hidden /> Administrators
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {admins.map((a) => (
                <li key={a.id}>
                  <span className="font-medium">{a.name}</span> <span className="text-muted-foreground">· {a.email}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Admins have every permission and can&apos;t be edited here.</p>
          </div>

          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h2 className="font-sans text-base font-semibold text-olive-950">What each permission allows</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {STAFF_PERMISSIONS.map((p) => (
                <div key={p.id}>
                  <dt className="font-medium text-olive-950">{p.label}</dt>
                  <dd className="text-muted-foreground">{p.description}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Categories, users, staff and settings are administrator-only. Real enforcement happens on the server.
            </p>
          </div>
        </aside>
      </div>

      <StaffFormSheet open={formOpen} onOpenChange={setFormOpen} staff={editing} />

      <AlertDialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{toRemove?.name}</strong> will lose all dashboard access. Their account is deleted in this demo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemove} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">
              {busy ? "Removing…" : "Remove staff"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function StaffFormSheet({ open, onOpenChange, staff }: { open: boolean; onOpenChange: (o: boolean) => void; staff: AppUser | null }) {
  const editing = !!staff;
  const {
    register, control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<StaffFormValues>({ resolver: zodResolver(staffSchema), defaultValues: { name: "", email: "", permissions: [] } });

  useEffect(() => {
    if (open) reset(staff ? { name: staff.name, email: staff.email, permissions: staff.permissions } : { name: "", email: "", permissions: [] });
  }, [open, staff, reset]);

  async function onSubmit(v: StaffFormValues) {
    try {
      if (staff) await userService.updateStaff(staff.id, { name: v.name, permissions: v.permissions as AppUser["permissions"] });
      else await userService.createStaff({ name: v.name, email: v.email, permissions: v.permissions as AppUser["permissions"] });
      toast.success(editing ? "Staff updated" : "Staff member added", {
        description: editing ? v.name : `${v.name} can sign in with ${v.email} in this demo.`,
      });
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't save the staff member", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-sand-200 p-5">
          <SheetTitle>{editing ? "Edit staff member" : "Add staff member"}</SheetTitle>
          <SheetDescription>Choose exactly what this person can manage.</SheetDescription>
        </SheetHeader>
        <form id="staff-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          <FormField label="Full name" htmlFor="staff-name" error={errors.name?.message} required>
            <Input id="staff-name" aria-invalid={!!errors.name} aria-describedby={describedBy("staff-name", errors.name?.message)} {...register("name")} />
          </FormField>
          <FormField label="Email" htmlFor="staff-email" error={errors.email?.message} hint={editing ? "The email can't be changed here." : undefined} required>
            <Input id="staff-email" type="email" disabled={editing} aria-invalid={!!errors.email} aria-describedby={describedBy("staff-email", errors.email?.message)} {...register("email")} />
          </FormField>

          <fieldset>
            <legend className="mb-2 text-sm font-medium text-olive-950">Permissions <span className="text-destructive" aria-hidden>*</span></legend>
            <Controller
              control={control}
              name="permissions"
              render={({ field }) => (
                <ul className="space-y-2">
                  {STAFF_PERMISSIONS.map((p) => {
                    const checked = field.value.includes(p.id);
                    return (
                      <li key={p.id}>
                        <label className="flex cursor-pointer items-start gap-3 rounded-md border bg-white p-3 hover:bg-sand-100">
                          <Checkbox
                            className="mt-0.5"
                            checked={checked}
                            onCheckedChange={(c) => field.onChange(c ? [...field.value, p.id] : field.value.filter((x) => x !== p.id))}
                          />
                          <span>
                            <span className="block text-sm font-medium text-olive-950">{p.label}</span>
                            <span className="block text-xs text-muted-foreground">{p.description}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            />
            {errors.permissions && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.permissions.message}</p>}
          </fieldset>
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="staff-form" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : editing ? "Save changes" : "Add staff"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
