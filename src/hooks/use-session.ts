"use client";

import { useMemo } from "react";
import { sessionStore } from "@/services/auth-service";
import { userStore } from "@/services/user-service";
import { useStore } from "./use-store";
import type { AppUser } from "@/types";

/**
 * The signed-in user, resolved live from the user store so permission changes
 * made by an admin apply immediately. Returns null for guests, for stale sessions
 * (e.g. an old-format record or a deleted account) and for suspended accounts.
 */
export function useSession(): AppUser | null {
  const [session] = useStore(sessionStore);
  const users = useStore(userStore);
  const userId = session?.userId;
  return useMemo(() => {
    if (!userId) return null;
    const user = users.find((u) => u.id === userId);
    return user && user.status === "active" ? user : null;
  }, [userId, users]);
}
