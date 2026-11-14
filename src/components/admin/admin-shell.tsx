"use client";

import { usePathname } from "next/navigation";
import {
  Award, BadgeCheck, BarChart3, CalendarDays, CreditCard, FileEdit, FileUp, HandCoins, Images, Landmark, LayoutDashboard,
  Megaphone, Receipt, Settings, ShieldCheck, Store, Tags, UserCog, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { AccessDenied } from "@/components/auth/access-gate";
import { AppShell, type ShellNavGroup } from "@/components/dashboard/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { useHydrated } from "@/hooks/use-store";
import {
  ADMIN_GROUPS, ROLE_LABEL, adminAccessState, sectionForPath, sectionLabel, visibleAdminSections, type AdminSectionId,
} from "@/lib/permissions";

const sectionIcon: Record<AdminSectionId, LucideIcon> = {
  dashboard: LayoutDashboard,
  businesses: Store,
  "edit-requests": FileEdit,
  verification: ShieldCheck,
  badges: Award,
  photos: Images,
  events: CalendarDays,
  import: FileUp,
  categories: Tags,
  benefits: Landmark,
  users: Users,
  staff: UserCog,
  plans: BadgeCheck,
  subscriptions: CreditCard,
  "ad-products": HandCoins,
  campaigns: Megaphone,
  "sponsorship-approvals": Wallet,
  "advertising-reviews": Receipt,
  payments: Receipt,
  reports: BarChart3,
  settings: Settings,
};

function titleFor(pathname: string, user: Parameters<typeof sectionLabel>[0]) {
  if (pathname.startsWith("/admin/businesses/new")) return "Add business";
  if (/^\/admin\/businesses\/[^/]+\/edit/.test(pathname)) return "Edit business";
  const section = sectionForPath(pathname);
  return section ? sectionLabel(user, section) : "Overview";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
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

  const access = adminAccessState(user, pathname);
  // Guests and members never see the dashboard chrome (no sidebar, no nav labels).
  if (access === "signed-out" || access === "forbidden-role") {
    return (
      <div className="min-h-dvh bg-sand-50">
        <AccessDenied state={access} pathname={pathname} />
      </div>
    );
  }

  const visible = visibleAdminSections(user);
  const current = sectionForPath(pathname);
  // Staff see a flat list in the order of their granted permissions; admins get the grouped sidebar.
  const groups: ShellNavGroup[] = ADMIN_GROUPS.map((heading) => ({
    heading: user?.role === "admin" || heading !== "Overview" ? heading : undefined,
    items: visible
      .filter((s) => s.group === heading)
      .map((s) => ({
        label: sectionLabel(user, s),
        href: s.href,
        icon: sectionIcon[s.id],
        active: current?.id === s.id,
      })),
  }));

  return (
    <AppShell
      groups={groups}
      navLabel="Admin"
      title={titleFor(pathname, user)}
      roleLabel={user ? ROLE_LABEL[user.role] : ""}
      logoHref="/admin"
    >
      {access === "allowed" ? children : <AccessDenied state="forbidden-permission" pathname={pathname} />}
    </AppShell>
  );
}
