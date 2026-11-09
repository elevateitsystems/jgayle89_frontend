"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LayoutDashboard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/access-gate";
import { UserTypeFields } from "@/components/auth/user-type-fields";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useSession } from "@/hooks/use-session";
import { PHASE1_PERMISSIONS, ROLE_LABEL, USER_TYPE_LABEL, isBackOffice } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { BRANCHES, profileSchema, type ProfileValues } from "@/schemas/auth";
import { userService } from "@/services/user-service";
import type { AppUser } from "@/types";

export function AccountClient() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}

function AccountContent() {
  const user = useSession();
  if (!user) return null; // RequireAuth already handles guests
  return <ProfileForm key={user.id} user={user} />;
}

function ProfileForm({ user }: { user: AppUser }) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, userType: user.userType ?? "civilian", branch: user.branch ?? "" },
  });

  useEffect(() => {
    reset({ name: user.name, userType: user.userType ?? "civilian", branch: user.branch ?? "" });
  }, [user, reset]);

  async function onSubmit(v: ProfileValues) {
    try {
      await userService.updateProfile(user.id, {
        name: v.name,
        userType: v.userType,
        branch: v.userType === "veteran" ? (v.branch as (typeof BRANCHES)[number]) : undefined,
      });
      toast.success("Profile updated");
    } catch (e) {
      toast.error("Couldn't save your profile", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const permissionLabels = user.role === "admin" ? ["Full access to every management area"] : PHASE1_PERMISSIONS.filter((p) => user.permissions.includes(p.id)).map((p) => p.label);

  return (
    <>
      <section className="border-b border-sand-200 bg-sand-100">
        <div className="container-page py-10 sm:py-12">
          <p className="eyebrow">My account</p>
          <h1 className="mt-2 text-3xl font-semibold text-olive-950 sm:text-4xl">Your profile</h1>
          <p className="mt-2 text-muted-foreground">Manage how you appear in the Mission: SITREP community.</p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-8 sm:py-12 lg:grid-cols-12">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5 rounded-lg border bg-card p-5 shadow-card sm:p-7 lg:col-span-7">
          <h2 className="text-xl font-semibold text-olive-950">Profile details</h2>
          <FormField label="Full name" htmlFor="acct-name" error={errors.name?.message} required>
            <Input id="acct-name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={describedBy("acct-name", errors.name?.message)} {...register("name")} />
          </FormField>
          <FormField label="Email" htmlFor="acct-email" hint="Your sign-in email. Changing it will be available once accounts are connected to the backend.">
            <Input id="acct-email" value={user.email} readOnly disabled aria-describedby="acct-email-hint" />
          </FormField>
          <UserTypeFields control={control} register={register} errors={errors} idPrefix="acct" />
          <Button type="submit" size="lg" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" /> Saving…
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </form>

        <aside className="space-y-5 lg:col-span-5">
          <div className="rounded-lg border bg-card p-5 shadow-card">
            <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-olive-700">Account</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Access level</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 font-medium"><ShieldCheck className="size-4 text-olive-600" aria-hidden /> {ROLE_LABEL[user.role]}</dd>
              </div>
              {user.userType && (
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Account type</dt>
                  <dd className="mt-0.5">{USER_TYPE_LABEL[user.userType]}{user.branch ? ` · ${user.branch}` : ""}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Member since</dt>
                <dd className="mt-0.5">{user.createdAt}</dd>
              </div>
            </dl>
          </div>

          {isBackOffice(user) && (
            <div className="rounded-lg border bg-card p-5 shadow-card">
              <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-olive-700">Your permissions</h2>
              {permissionLabels.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No management permissions assigned yet.</p>
              ) : (
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm marker:text-olive-600">
                  {permissionLabels.map((l) => (
                    <li key={l}>{l}</li>
                  ))}
                </ul>
              )}
              <Link href="/admin" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
                <LayoutDashboard /> Open dashboard
              </Link>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
