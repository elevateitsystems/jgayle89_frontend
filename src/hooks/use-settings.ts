"use client";

import { useMemo } from "react";
import { defaultSettings, settingsStore } from "@/services/settings-service";
import { useStore } from "./use-store";
import type { SiteSettings } from "@/types";

export function useSiteSettings(): SiteSettings {
  const records = useStore(settingsStore);
  return useMemo(() => ({ ...defaultSettings, ...records[0] }), [records]);
}
