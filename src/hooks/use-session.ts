"use client";

import { sessionStore } from "@/services/auth-service";
import { useStore } from "./use-store";

export function useSession() {
  const [session] = useStore(sessionStore);
  return session ?? null;
}
