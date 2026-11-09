"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LockKeyhole, ShieldAlert, UserRoundX, type LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { useHydrated } from "@/hooks/use-store";
import type { AccessState } from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface NoticeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions: { href: string; label: string; primary?: boolean }[];
}

function Notice({ icon: Icon, title, description, actions }: NoticeProps) {
  return (
    <div role="alert" className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:py-28">
      <span className="flex size-14 items-center justify-center rounded-full bg-olive-100 text-olive-700">
        <Icon className="size-7" aria-hidden />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-olive-950 sm:text-3xl">{title}</h1>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        {actions.map((a) => (
          <Link key={a.href + a.label} href={a.href} className={cn(buttonVariants({ variant: a.primary ? "default" : "outline", size: "lg" }))}>
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function GateSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-20" aria-busy="true" aria-label="Checking access">
      <Skeleton className="mx-auto size-14 rounded-full" />
      <Skeleton className="mx-auto h-8 w-2/3" />
      <Skeleton className="mx-auto h-4 w-full" />
    </div>
  );
}

const loginHref = (pathname: string) => `/login?next=${encodeURIComponent(pathname)}`;

/** Wraps member-only pages (e.g. /account). Guests are asked to sign in. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useSession();
  const hydrated = useHydrated();
  if (!hydrated) return <GateSkeleton />;
  if (!user) {
    return (
      <Notice
        icon={LockKeyhole}
        title="Sign in to continue"
        description="This page is for registered members. Sign in or create a free account."
        actions={[
          { href: loginHref(pathname), label: "Sign in", primary: true },
          { href: "/register", label: "Create an account" },
        ]}
      />
    );
  }
  return <>{children}</>;
}

export function AccessDenied({ state, pathname }: { state: Exclude<AccessState, "allowed">; pathname: string }) {
  if (state === "signed-out") {
    return (
      <Notice
        icon={LockKeyhole}
        title="Sign in required"
        description="The management dashboard is for Mission: SITREP administrators and staff. Please sign in to continue."
        actions={[
          { href: loginHref(pathname), label: "Sign in", primary: true },
          { href: "/", label: "Back to site" },
        ]}
      />
    );
  }
  if (state === "forbidden-role") {
    return (
      <Notice
        icon={ShieldAlert}
        title="Staff and admin area"
        description="Your account doesn't have access to the management dashboard. You can keep browsing businesses and events, or manage your profile."
        actions={[
          { href: "/directory", label: "Browse the directory", primary: true },
          { href: "/account", label: "My profile" },
        ]}
      />
    );
  }
  return (
    <Notice
      icon={UserRoundX}
      title="You don't have permission for this section"
      description="Your staff account hasn't been given access to this area. Ask an administrator if you need it."
      actions={[{ href: "/admin", label: "Back to dashboard", primary: true }]}
    />
  );
}
