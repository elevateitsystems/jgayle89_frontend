import { hasPermission, isAdmin } from "@/lib/permissions";
import type { AppUser, Permission } from "@/types";

/** The signed-in person performing an action. The API derives this from the auth token; the demo passes it in. */
export type Reviewer = Pick<AppUser, "id" | "name" | "role" | "permissions">;
export type Requester = Pick<AppUser, "id" | "name">;

/**
 * Demo stand-in for server-side authorization. Real enforcement MUST happen in the Django API —
 * these guards only keep the mock workflow honest (e.g. owners can never approve their own requests).
 */
export function requirePermission(user: Reviewer, permission: Permission, action = "do that") {
  if (!hasPermission(user, permission)) throw new Error(`You don't have permission to ${action}.`);
}

export function requireAdmin(user: Reviewer, action = "do that") {
  if (!isAdmin(user)) throw new Error(`Only administrators can ${action}.`);
}
