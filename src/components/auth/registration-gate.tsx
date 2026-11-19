"use client";

import { useRegistrationOpen } from "@/hooks/use-settings";

/**
 * Renders sign-up links/buttons only while public registration is open (Admin → Settings).
 * Existing members can always sign in; nothing else on the site is affected.
 */
export function IfRegistrationOpen({ children, fallback = null }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <>{useRegistrationOpen() ? children : fallback}</>;
}
