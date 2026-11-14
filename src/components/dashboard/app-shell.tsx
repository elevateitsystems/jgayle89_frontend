"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut, Menu, ShieldCheck, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth-service";

export interface ShellNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
  /** Opens an existing public page rather than a dashboard page. */
  publicPage?: boolean;
}

export interface ShellNavGroup {
  heading?: string;
  items: ShellNavItem[];
}

interface Props {
  groups: ShellNavGroup[];
  navLabel: string;
  title: string;
  /** Short role line under the user's name. */
  roleLabel: string;
  logoHref: string;
  /** Link to the public website shown at the bottom of the sidebar. */
  children: React.ReactNode;
}

function SidebarContent({ groups, navLabel, roleLabel, logoHref, onNavigate }: Omit<Props, "children" | "title"> & { onNavigate?: () => void }) {
  const router = useRouter();
  const session = useSession();

  async function signOut() {
    await authService.logout();
    toast.success("You've been signed out.");
    router.push("/login");
  }

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center border-b border-sidebar-border px-5 py-4">
        <span className="rounded-lg bg-sand-50 p-2.5">
          <Logo imgClassName="h-16" href={logoHref} />
        </span>
      </div>

      <nav aria-label={navLabel} className="flex-1 space-y-1 overflow-y-auto p-3">
        {groups.map(
          (group, gi) =>
            group.items.length > 0 && (
              <div key={group.heading ?? gi} className="space-y-1">
                {group.heading && (
                  <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-olive-300/70">{group.heading}</p>
                )}
                {group.items.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={item.active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                      item.active ? "bg-sidebar-accent text-white shadow-[inset_3px_0_0_var(--color-brass)]" : "text-olive-100/80 hover:bg-sidebar-accent/60 hover:text-white",
                    )}
                  >
                    <item.icon className="size-[18px] shrink-0" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.publicPage && (
                      <>
                        <ExternalLink className="size-3.5 shrink-0 opacity-60" aria-hidden />
                        <span className="sr-only">(opens the public site)</span>
                      </>
                    )}
                  </Link>
                ))}
              </div>
            ),
        )}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="mb-1 flex min-h-10 items-center gap-2 rounded-md px-3 text-xs font-medium text-olive-100/70 hover:bg-sidebar-accent/60 hover:text-white"
        >
          <ExternalLink className="size-3.5" aria-hidden /> Back to public site
        </Link>
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-olive-600 text-sm font-semibold text-white">
            {(session?.name ?? "?").slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{session?.name}</p>
            <p className="flex items-center gap-1 truncate text-xs text-olive-300">
              <ShieldCheck className="size-3 shrink-0" aria-hidden /> {roleLabel}
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

/** Sidebar + sticky header chrome shared by the staff/admin area and the member dashboards. */
export function AppShell({ children, title, ...nav }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh bg-sand-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-sidebar-border lg:block">
        <SidebarContent {...nav} />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-sand-200 bg-sand-50/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 border-0 bg-sidebar p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{nav.navLabel} navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent {...nav} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <h2 className="truncate font-heading text-xl font-semibold text-olive-950">{title}</h2>
        </header>

        <main id="main" className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
