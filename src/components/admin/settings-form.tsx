"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { Switch } from "@/components/ui/switch";
import { useSiteSettings } from "@/hooks/use-settings";
import { settingsService } from "@/services/settings-service";

export function SettingsForm() {
  const settings = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const switchId = useId();

  async function toggleGoogle(next: boolean) {
    setSaving(true);
    try {
      await settingsService.update({ showGoogleRatings: next });
      toast.success(next ? "Google ratings are now visible on business profiles." : "Google ratings are now hidden.");
    } catch {
      toast.error("Couldn't save the setting. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" description="Site-wide options that apply to every business profile." />
      <section aria-labelledby="ratings-settings-h" className="max-w-2xl rounded-lg border bg-card p-5 shadow-card sm:p-6">
        <h2 id="ratings-settings-h" className="text-lg font-semibold text-olive-950">Ratings</h2>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor={switchId} className="text-sm font-medium text-olive-950">Show Google ratings</label>
            <p className="mt-1 text-sm text-muted-foreground">
              When off, the Google rating is hidden from every business profile. The website rating is always shown.
              Google values are currently sample data; no Google API is connected.
            </p>
          </div>
          <Switch
            id={switchId}
            checked={settings.showGoogleRatings}
            disabled={saving}
            onCheckedChange={toggleGoogle}
            aria-label="Show Google ratings"
          />
        </div>
      </section>
    </>
  );
}
