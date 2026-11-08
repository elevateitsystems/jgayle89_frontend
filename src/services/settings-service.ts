import { createCollectionStore, delay } from "@/lib/demo-store";
import type { SiteSettings } from "@/types";

export const defaultSettings: SiteSettings = {
  showGoogleRatings: true,
};

/** Single-record collection (the demo store holds arrays). */
export const settingsStore = createCollectionStore<SiteSettings>("settings", [defaultSettings]);

/** Settings data-access layer (demo). Swap for `GET/PATCH /api/settings` later. */
export const settingsService = {
  get(): SiteSettings {
    return { ...defaultSettings, ...settingsStore.getSnapshot()[0] };
  },

  async update(patch: Partial<SiteSettings>): Promise<SiteSettings> {
    await delay(250);
    const next = { ...settingsService.get(), ...patch };
    settingsStore.set([next]);
    return next;
  },

  reset() {
    settingsStore.reset();
  },
};
