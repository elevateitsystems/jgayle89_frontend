"use client";

import Link from "next/link";
import { useBusinesses } from "@/hooks/use-businesses";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { hasPermission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { userStore } from "@/services/user-service";

const linkClass = "font-semibold text-olive-950 underline-offset-2 hover:text-olive-700 hover:underline";

/**
 * Clickable business name for admin tables (client update §8). Staff who manage listings go to the management page;
 * everyone else goes to the public profile. Unknown ids fall back to plain text.
 */
export function AdminBusinessLink({ businessId, name, className }: { businessId: string; name?: string; className?: string }) {
  const viewer = useSession();
  const { businesses } = useBusinesses();
  const b = businesses.find((x) => x.id === businessId);
  const label = name ?? b?.name ?? businessId;
  if (!b) return <span className={cn("font-semibold text-olive-950", className)}>{label}</span>;
  const href = hasPermission(viewer, "businesses.manage") ? `/admin/businesses/${b.id}/edit` : `/directory/${b.slug}`;
  return <Link href={href} className={cn(linkClass, className)}>{label}</Link>;
}

/** Clickable member name → the member's management page (needs "Manage members"); plain text otherwise. */
export function AdminMemberLink({ userId, name, className }: { userId: string; name?: string; className?: string }) {
  const viewer = useSession();
  const users = useStore(userStore);
  const u = users.find((x) => x.id === userId);
  const label = name ?? u?.name ?? userId;
  if (!u || !hasPermission(viewer, "users.manage")) return <span className={cn("font-semibold text-olive-950", className)}>{label}</span>;
  return <Link href={`/admin/users/${u.id}`} className={cn(linkClass, className)}>{label}</Link>;
}
