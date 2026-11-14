"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShieldAlert } from "lucide-react";
import { AccessDenied } from "@/components/auth/access-gate";
import { AppShell, type ShellNavGroup } from "@/components/dashboard/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { useHydrated } from "@/hooks/use-store";
import { PERSONA_LABEL, activeNavItem, canOpenDashboardPath, isMemberPersona, navFor, personaOf } from "@/features/dashboard/nav";
import { cn } from "@/lib/utils";

function Notice({ title, description, href, label }: { title: string; description: string; href: string; label: string }) {
  return (
    <div role="alert" className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:py-28">
      <span className="flex size-14 items-center justify-center rounded-full bg-olive-100 text-olive-700">
        <ShieldAlert className="size-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-olive-950 sm:text-3xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <Link href={href} className={cn(buttonVariants({ size: "lg" }), "mt-7")}>
        <LayoutDashboard /> {label}
      </Link>
    </div>
  );
}

/**
 * Chrome + access control for /dashboard. Veteran, Civilian and Business Owner accounts each get their own
 * navigation; they can only open pages that appear in it. Admin/Staff use /admin instead.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useSession();
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-sand-50 p-8" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-dvh bg-sand-50">
        <AccessDenied state="signed-out" pathname={pathname} variant="member" />
      </div>
    );
  }

  const persona = personaOf(user);
  if (!isMemberPersona(persona)) {
    return (
      <div className="min-h-dvh bg-sand-50">
        <Notice
          title="Use the staff dashboard"
          description="Administrator and staff accounts manage Mission: SITREP from the management dashboard."
          href="/admin"
          label="Open management dashboard"
        />
      </div>
    );
  }

  const nav = navFor(persona);
  const current = activeNavItem(persona, pathname);
  const groups: ShellNavGroup[] = [
    { items: nav.map((i) => ({ label: i.label, href: i.href, icon: i.icon, publicPage: i.publicPage, active: current?.href === i.href })) },
  ];
  const allowed = canOpenDashboardPath(persona, pathname);

  return (
    <AppShell groups={groups} navLabel="Dashboard" title={current?.label ?? "Dashboard"} roleLabel={PERSONA_LABEL[persona]} logoHref="/dashboard">
      {allowed ? (
        children
      ) : (
        <Notice
          title="Not available for your account"
          description="That page isn't part of your dashboard. Head back to your overview to continue."
          href="/dashboard"
          label="Back to overview"
        />
      )}
    </AppShell>
  );
}
