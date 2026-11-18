"use client";

import { useMemo } from "react";
import { defaultSettings, settingsStore } from "@/services/settings-service";
import { useStore } from "./use-store";
import type { SiteSettings } from "@/types";

export function useSiteSettings(): SiteSettings {
  const records = useStore(settingsStore);
  return useMemo(() => ({ ...defaultSettings, ...records[0] }), [records]);
}

/** Admin switch: whether new public sign-ups are accepted (existing members always sign in). */
export function useRegistrationOpen(): boolean {
  return useSiteSettings().registrationOpen;
}
