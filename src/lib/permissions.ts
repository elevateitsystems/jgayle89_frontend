import type { AppUser, Permission, UserRole } from "@/types";

/**
 * Role-based access rules for the FRONTEND. These only decide what the UI shows;
 * they are a convenience, not security. The backend must enforce the same rules
 * on every request. Pure module (no runtime imports) so it can be unit-tested.
 *
 * Roles: admin (everything) · staff (assigned permissions) · user (registered member).
 * Veteran / Civilian is a profile attribute (AppUser.userType), never a role here.
 */

export interface PermissionInfo {
  id: Permission;
  label: string;
  description: string;
}

/**
 * Every permission an admin can grant to a staff member. The staff UI, nav and route checks
 * all read this list, so adding one here (plus a section that requires it) is all a new area needs.
 */
export const STAFF_PERMISSIONS: PermissionInfo[] = [
  { id: "businesses.manage", label: "Manage business listings", description: "Add, edit and delete business listings." },
  { id: "photos.upload", label: "Upload business photos", description: "Add or replace cover and profile photos." },
  { id: "csv.import", label: "Import businesses (CSV)", description: "Bulk-add listings from a CSV file." },
  { id: "events.manage", label: "Manage events", description: "Add, edit, publish and delete events." },
  { id: "edits.review", label: "Review business edit requests", description: "Approve, reject or request changes to owner edit requests." },
  { id: "verification.review", label: "Review business verification", description: "Review badge requests and supporting documents." },
  { id: "badges.manage", label: "Manage business badges", description: "Assign and revoke badges on business listings." },
  { id: "benefits.manage", label: "Manage benefits", description: "Edit entries in the veteran benefits directory." },
  { id: "sponsorships.review", label: "Review sponsorships", description: "Approve, reject and schedule sponsorship campaigns." },
  { id: "advertising.review", label: "Review advertising", description: "Approve, reject and schedule advertising campaigns." },
  { id: "users.manage", label: "Manage members", description: "View members and suspend or reactivate accounts." },
];

export const ALL_PERMISSION_IDS = STAFF_PERMISSIONS.map((p) => p.id);

type Actor = Pick<AppUser, "role" | "permissions"> | null | undefined;

export const isBackOffice = (u: Actor): boolean => !!u && (u.role === "admin" || u.role === "staff");
export const isAdmin = (u: Actor): boolean => !!u && u.role === "admin";

/** Admin always passes; staff need the permission assigned; users and guests never do. */
export function hasPermission(u: Actor, permission: Permission): boolean {
  if (!u) return false;
  if (u.role === "admin") return true;
  return u.role === "staff" && u.permissions.includes(permission);
}

/** Keep only valid, active Phase 1 permission ids (drops unknown / future ones). */
export function sanitizePermissions(input: readonly string[]): Permission[] {
  return ALL_PERMISSION_IDS.filter((id) => input.includes(id));
}

export type AdminSectionId =
  | "dashboard"
  | "businesses"
  | "edit-requests"
  | "verification"
  | "badges"
  | "photos"
  | "events"
  | "import"
  | "categories"
  | "benefits"
  | "users"
  | "staff"
  | "plans"
  | "subscriptions"
  | "ad-products"
  | "campaigns"
  | "sponsorship-approvals"
  | "advertising-reviews"
  | "payments"
  | "reports"
  | "settings";

type Requirement = { kind: "backoffice" } | { kind: "permission"; permission: Permission } | { kind: "admin" };

export interface AdminSection {
  id: AdminSectionId;
  label: string;
  /** Label shown to staff when it differs from the administrator wording. */
  staffLabel?: string;
  href: string;
  exact?: boolean;
  requires: Requirement;
}

/** Sidebar groups, in display order. */
export const ADMIN_GROUPS = ["Overview", "Listings & people", "Reviews", "Membership & revenue", "Content", "System"] as const;
export type AdminGroup = (typeof ADMIN_GROUPS)[number];

const perm = (permission: Permission): Requirement => ({ kind: "permission", permission });

/** Single source of truth for admin/staff navigation AND route protection. */
export const ADMIN_SECTIONS: (AdminSection & { group: AdminGroup })[] = [
  { id: "dashboard", group: "Overview", label: "Overview", href: "/admin", exact: true, requires: { kind: "backoffice" } },
  { id: "businesses", group: "Listings & people", label: "Business Management", staffLabel: "Business Listings", href: "/admin/businesses", requires: perm("businesses.manage") },
  { id: "categories", group: "Listings & people", label: "Business Categories", href: "/admin/categories", requires: { kind: "admin" } },
  { id: "badges", group: "Listings & people", label: "Business Badges", staffLabel: "Badge Management", href: "/admin/badges", requires: perm("badges.manage") },
  { id: "users", group: "Listings & people", label: "User Management", href: "/admin/users", requires: perm("users.manage") },
  { id: "staff", group: "Listings & people", label: "Staff Management", href: "/admin/staff", requires: { kind: "admin" } },
  { id: "edit-requests", group: "Reviews", label: "Business Edit Requests", href: "/admin/edit-requests", requires: perm("edits.review") },
  { id: "verification", group: "Reviews", label: "Business Verification", href: "/admin/verification", requires: perm("verification.review") },
  { id: "sponsorship-approvals", group: "Reviews", label: "Sponsorship Approvals", href: "/admin/sponsorship-approvals", requires: perm("sponsorships.review") },
  { id: "advertising-reviews", group: "Reviews", label: "Advertising Reviews", href: "/admin/advertising-reviews", requires: perm("advertising.review") },
  { id: "plans", group: "Membership & revenue", label: "Membership Plans", href: "/admin/plans", requires: { kind: "admin" } },
  { id: "subscriptions", group: "Membership & revenue", label: "Subscriptions", href: "/admin/subscriptions", requires: { kind: "admin" } },
  { id: "ad-products", group: "Membership & revenue", label: "Sponsorship Products", href: "/admin/ad-products", requires: { kind: "admin" } },
  { id: "campaigns", group: "Membership & revenue", label: "Advertising Campaigns", href: "/admin/campaigns", requires: { kind: "admin" } },
  { id: "payments", group: "Membership & revenue", label: "Payments & Transactions", href: "/admin/payments", requires: { kind: "admin" } },
  { id: "events", group: "Content", label: "Events Management", staffLabel: "Events", href: "/admin/events", requires: perm("events.manage") },
  { id: "benefits", group: "Content", label: "Benefits Management", staffLabel: "Benefits", href: "/admin/benefits", requires: perm("benefits.manage") },
  { id: "photos", group: "Content", label: "Photos", href: "/admin/photos", requires: perm("photos.upload") },
  { id: "import", group: "Content", label: "CSV Import", href: "/admin/import", requires: perm("csv.import") },
  { id: "reports", group: "System", label: "Reports & Analytics", href: "/admin/reports", requires: { kind: "admin" } },
  { id: "settings", group: "System", label: "Settings", href: "/admin/settings", requires: { kind: "admin" } },
];

/** The label a given user should see for a section (staff sometimes get shorter wording). */
export function sectionLabel(u: Actor, s: AdminSection): string {
  return u?.role === "staff" && s.staffLabel ? s.staffLabel : s.label;
}

export function canAccessSection(u: Actor, section: Pick<AdminSection, "requires">): boolean {
  const r = section.requires;
  if (r.kind === "backoffice") return isBackOffice(u);
  if (r.kind === "admin") return isAdmin(u);
  return hasPermission(u, r.permission);
}

export function visibleAdminSections(u: Actor) {
  return ADMIN_SECTIONS.filter((s) => canAccessSection(u, s));
}

/** Longest-prefix match so /admin/businesses/new belongs to "businesses". */
export function sectionForPath(pathname: string): AdminSection | undefined {
  const path = pathname.replace(/\/+$/, "") || "/";
  return [...ADMIN_SECTIONS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((s) => (s.exact ? path === s.href : path === s.href || path.startsWith(`${s.href}/`)));
}

export type AccessState = "allowed" | "signed-out" | "forbidden-role" | "forbidden-permission";

/** Decide what to render for an /admin path. Unknown admin paths fall back to the dashboard rule. */
export function adminAccessState(u: (Actor & { role: UserRole }) | null | undefined, pathname: string): AccessState {
  if (!u) return "signed-out";
  if (!isBackOffice(u)) return "forbidden-role";
  const section = sectionForPath(pathname) ?? ADMIN_SECTIONS[0];
  return canAccessSection(u, section) ? "allowed" : "forbidden-permission";
}

/** Where to send someone right after signing in. */
export function homePathFor(u: Actor): string {
  return isBackOffice(u) ? "/admin" : "/dashboard";
}

/** Only allow same-site relative redirects (blocks open-redirects like //evil.com). */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}

export const ROLE_LABEL: Record<UserRole, string> = { admin: "Administrator", staff: "Staff", user: "Member" };
export const USER_TYPE_LABEL = { veteran: "Veteran / Military", civilian: "Civilian", business_owner: "Business Owner" } as const;
