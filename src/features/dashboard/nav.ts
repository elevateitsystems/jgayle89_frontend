import {
  Award, BadgeCheck, BarChart3, Bookmark, Briefcase, CalendarClock, CalendarDays, CreditCard, FileEdit, GraduationCap,
  HandCoins, HeartHandshake, Landmark, LayoutDashboard, Megaphone, Percent, Receipt, Settings, Share2, Store, UserCheck, Calculator,
  type LucideIcon,
} from "lucide-react";
import type { AppUser, PlanAudience } from "@/types";

/**
 * Role-based dashboard navigation — the single place that says which sections each account type sees.
 *
 * Admin and Staff navigation lives in `lib/permissions` (ADMIN_SECTIONS), because it is also the route-protection
 * table and depends on configurable staff permissions. Members (Veteran, Civilian, Business Owner) use /dashboard.
 */
export type Persona = "admin" | "staff" | "veteran" | "civilian" | "business_owner";
export type MemberPersona = Exclude<Persona, "admin" | "staff">;

export const PERSONA_LABEL: Record<Persona, string> = {
  admin: "Administrator",
  staff: "Staff",
  veteran: "Veteran / Military",
  civilian: "Civilian",
  business_owner: "Business Owner",
};

type Actor = Pick<AppUser, "role" | "userType"> | null | undefined;

export function personaOf(u: Actor): Persona | null {
  if (!u) return null;
  if (u.role === "admin") return "admin";
  if (u.role === "staff") return "staff";
  return u.userType ?? "civilian";
}

export const isMemberPersona = (p: Persona | null): p is MemberPersona => p === "veteran" || p === "civilian" || p === "business_owner";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match the path exactly (used for Overview). */
  exact?: boolean;
  /** Leaves the dashboard for an existing public page (shown with an "opens public site" hint). */
  publicPage?: boolean;
}

const overview: DashboardNavItem = { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true };
const settings: DashboardNavItem = { label: "Account Settings", href: "/dashboard/settings", icon: Settings };
const membership: DashboardNavItem = { label: "My Membership", href: "/dashboard/membership", icon: BadgeCheck };
const saved: DashboardNavItem = { label: "Saved Businesses", href: "/dashboard/saved", icon: Bookmark };
const events: DashboardNavItem = { label: "Events", href: "/events", icon: CalendarDays, publicPage: true };
const career: DashboardNavItem = { label: "Career Resources", href: "/dashboard/career", icon: Briefcase };

export const MEMBER_NAV: Record<MemberPersona, DashboardNavItem[]> = {
  veteran: [
    overview,
    membership,
    { label: "Benefits Directory", href: "/dashboard/benefits", icon: Landmark },
    saved,
    events,
    { label: "Financial Tools", href: "/dashboard/financial", icon: Calculator },
    career,
    { label: "Appointments", href: "/dashboard/appointments", icon: CalendarClock },
    settings,
  ],
  civilian: [
    overview,
    membership,
    { label: "Business Directory", href: "/directory", icon: Store, publicPage: true },
    saved,
    { label: "Community Resources", href: "/dashboard/community", icon: HeartHandshake },
    events,
    career,
    { label: "Financial Education", href: "/dashboard/financial-education", icon: GraduationCap },
    settings,
  ],
  business_owner: [
    overview,
    { label: "My Businesses", href: "/dashboard/businesses", icon: Store },
    { label: "Business Memberships", href: "/dashboard/memberships", icon: CreditCard },
    { label: "Edit Requests", href: "/dashboard/edit-requests", icon: FileEdit },
    { label: "Badges & Verification", href: "/dashboard/badges", icon: Award },
    { label: "Business Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Social Media Links", href: "/dashboard/social-links", icon: Share2 },
    { label: "Hiring Status", href: "/dashboard/hiring", icon: UserCheck },
    { label: "Discounts & Promotions", href: "/dashboard/promotions", icon: Percent },
    { label: "Advertisements", href: "/dashboard/advertising", icon: Megaphone },
    { label: "Sponsorships", href: "/dashboard/sponsorships", icon: HandCoins },
    { label: "Payment History", href: "/dashboard/payments", icon: Receipt },
    settings,
  ],
};

export const navFor = (p: MemberPersona) => MEMBER_NAV[p];

/** Sub-sections that live under another item's navigation entry (the campaign builder belongs to Advertisements). */
const NAV_ALIASES: Record<string, string> = { "/dashboard/campaigns": "/dashboard/advertising" };

const isActivePath = (item: DashboardNavItem, pathname: string) =>
  item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

export function activeNavItem(persona: MemberPersona, pathname: string) {
  let path = pathname.replace(/\/+$/, "") || "/";
  for (const [prefix, target] of Object.entries(NAV_ALIASES)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) path = target;
  }
  return navFor(persona)
    .filter((i) => !i.publicPage)
    .sort((a, b) => b.href.length - a.href.length)
    .find((i) => isActivePath(i, path));
}

/** A member may only open dashboard pages that appear in their own navigation. */
export const canOpenDashboardPath = (persona: MemberPersona, pathname: string) => !!activeNavItem(persona, pathname);

/** Which plan audience a member persona buys from. */
export function membershipAudience(p: MemberPersona): PlanAudience {
  return p === "business_owner" ? "business" : p;
}

