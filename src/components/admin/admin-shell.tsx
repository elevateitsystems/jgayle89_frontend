"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  FileUp,
  Images,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AccessDenied } from "@/components/auth/access-gate";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { useHydrated } from "@/hooks/use-store";
import {
  ROLE_LABEL,
  adminAccessState,
  sectionForPath,
  visibleAdminSections,
  type AdminSectionId,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth-service";

const sectionIcon: Record<AdminSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  businesses: Store,
  photos: Images,
  events: CalendarDays,
  import: FileUp,
  categories: Tags,
  users: Users,
  staff: UserCog,
  settings: Settings,
};

/** Sections only administrators can reach get their own heading in the sidebar. */
const ADMIN_ONLY: AdminSectionId[] = ["categories", "users", "staff", "settings"];

function titleFor(pathname: string) {
  if (pathname.startsWith("/admin/businesses/new")) return "Add business";
  if (pathname.includes("/edit")) return "Edit business";
  return sectionForPath(pathname)?.label ?? "Dashboard";
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const sections = visibleAdminSections(session);

  async function signOut() {
    await authService.logout();
    toast.success("You've been signed out.");
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center border-b border-sidebar-border px-5 py-4">
        <span className="rounded-lg bg-sand-50 p-2.5">
          <Logo imgClassName="h-16" href="/admin" />
        </span>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-1 overflow-y-auto p-3">
        {[
          { heading: "Manage", items: sections.filter((x) => !ADMIN_ONLY.includes(x.id)) },
          { heading: "Administration", items: sections.filter((x) => ADMIN_ONLY.includes(x.id)) },
        ].map(
          (group) =>
            group.items.length > 0 && (
              <div key={group.heading} className="space-y-1">
                <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-olive-300/70">{group.heading}</p>
                {group.items.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  const Icon = sectionIcon[item.id];
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                        active ? "bg-sidebar-accent text-white shadow-[inset_3px_0_0_var(--color-brass)]" : "text-olive-100/80 hover:bg-sidebar-accent/60 hover:text-white",
                      )}
                    >
                      <Icon className="size-[18px]" aria-hidden />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ),
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-olive-600 text-sm font-semibold text-white">
            {(session?.name ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{session?.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-olive-300">
              <ShieldCheck className="size-3 shrink-0" aria-hidden /> {session ? ROLE_LABEL[session.role] : ""}
            </p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={signOut} aria-label="Sign out" className="text-olive-100 hover:bg-sidebar-accent hover:text-white">
            <LogOut />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useSession();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-sand-50 p-8" aria-busy="true" aria-label="Loading dashboard">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  const access = adminAccessState(user, pathname);
  // Guests and members never see the dashboard chrome (no sidebar, no nav labels).
  if (access === "signed-out" || access === "forbidden-role") {
    return (
      <div className="min-h-dvh bg-sand-50">
        <AccessDenied state={access} pathname={pathname} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-sand-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarContent />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-sand-200 bg-sand-50/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 border-0 bg-sidebar p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Admin navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <h2 className="font-heading text-xl font-semibold text-olive-950">{titleFor(pathname)}</h2>
        </header>

        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {access === "allowed" ? children : <AccessDenied state="forbidden-permission" pathname={pathname} />}
        </main>
      </div>
    </div>
  );
}
