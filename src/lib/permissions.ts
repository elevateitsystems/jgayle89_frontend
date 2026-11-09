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
 * Permissions that are ACTIVE in Phase 1 — the only ones the UI may offer.
 * Future permissions (Resources, Appointments, Orders) are intentionally absent;
 * add them here when those phases ship, and the staff UI and checks pick them up.
 */
export const PHASE1_PERMISSIONS: PermissionInfo[] = [
  { id: "businesses.manage", label: "Manage business listings", description: "Add, edit and delete business listings." },
  { id: "photos.upload", label: "Upload business photos", description: "Add or replace cover and profile photos." },
  { id: "csv.import", label: "Import businesses (CSV)", description: "Bulk-add listings from a CSV file." },
  { id: "events.manage", label: "Manage events", description: "Add, edit, publish and delete events." },
];

export const ALL_PERMISSION_IDS = PHASE1_PERMISSIONS.map((p) => p.id);

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
  | "photos"
  | "events"
  | "import"
  | "categories"
  | "users"
  | "staff"
  | "settings";

type Requirement = { kind: "backoffice" } | { kind: "permission"; permission: Permission } | { kind: "admin" };

export interface AdminSection {
  id: AdminSectionId;
  label: string;
  href: string;
  exact?: boolean;
  requires: Requirement;
}

/** Single source of truth for admin navigation AND route protection. */
export const ADMIN_SECTIONS: AdminSection[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin", exact: true, requires: { kind: "backoffice" } },
  { id: "businesses", label: "Businesses", href: "/admin/businesses", requires: { kind: "permission", permission: "businesses.manage" } },
  { id: "photos", label: "Photos", href: "/admin/photos", requires: { kind: "permission", permission: "photos.upload" } },
  { id: "events", label: "Events", href: "/admin/events", requires: { kind: "permission", permission: "events.manage" } },
  { id: "import", label: "CSV Import", href: "/admin/import", requires: { kind: "permission", permission: "csv.import" } },
  { id: "categories", label: "Categories", href: "/admin/categories", requires: { kind: "admin" } },
  { id: "users", label: "Users", href: "/admin/users", requires: { kind: "admin" } },
  { id: "staff", label: "Staff", href: "/admin/staff", requires: { kind: "admin" } },
  { id: "settings", label: "Settings", href: "/admin/settings", requires: { kind: "admin" } },
];

export function canAccessSection(u: Actor, section: AdminSection): boolean {
  const r = section.requires;
  if (r.kind === "backoffice") return isBackOffice(u);
  if (r.kind === "admin") return isAdmin(u);
  return hasPermission(u, r.permission);
}

export function visibleAdminSections(u: Actor): AdminSection[] {
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
  return isBackOffice(u) ? "/admin" : "/directory";
}

/** Only allow same-site relative redirects (blocks open-redirects like //evil.com). */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}

export const ROLE_LABEL: Record<UserRole, string> = { admin: "Administrator", staff: "Staff", user: "Member" };
export const USER_TYPE_LABEL = { veteran: "Veteran / Military", civilian: "Civilian" } as const;
