"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "./page-header";
import { Switch } from "@/components/ui/switch";
import { useSiteSettings } from "@/hooks/use-settings";
import { settingsService } from "@/services/settings-service";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";
import { resetAllDemoData } from "@/services/demo-reset";
import { NativeSelect } from "@/components/ui/native-select";
import { useSession } from "@/hooks/use-session";
import { auditService } from "@/services/audit-service";
import type { ApprovalRule, OfferApprovalSettings } from "@/types";

const RULE_LABEL: Record<ApprovalRule, string> = {
  staff: "Staff approval required",
  owner: "Business owner approval required",
  both: "Both staff and business owner approval required",
};

export function SettingsForm() {
  const settings = useSiteSettings();
  const [saving, setSaving] = useState(false);
  const switchId = useId();
  const regId = useId();
  const [confirmReset, setConfirmReset] = useState(false);
  const user = useSession();

  async function toggleRegistration(next: boolean) {
    setSaving(true);
    try {
      await settingsService.update({ registrationOpen: next });
      if (user) auditService.record(user, "settings", next ? "opened registration" : "closed registration", { id: "registration", name: "Public registration" });
      toast.success(next ? "Registration is open — new members can sign up." : "Registration is closed. Existing members can still sign in.");
    } catch {
      toast.error("Couldn't save the setting. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function setRule(key: keyof OfferApprovalSettings, rule: ApprovalRule) {
    setSaving(true);
    try {
      await settingsService.update({ offerApproval: { ...settings.offerApproval, [key]: rule } });
      if (user) auditService.record(user, "settings", "changed offer approval rule", { id: key, name: key === "ownerSubmitted" ? "Owner-submitted offers" : "Staff-created offers" }, RULE_LABEL[rule]);
      toast.success("Approval rule saved", { description: "Applies to offers submitted from now on." });
    } catch {
      toast.error("Couldn't save the rule.");
    } finally {
      setSaving(false);
    }
  }

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
      <PageHeader title="Settings" description="Site-wide options: registration, offer approvals and ratings." />
      <section aria-labelledby="reg-settings-h" className="mb-6 max-w-2xl rounded-lg border bg-card p-5 shadow-card sm:p-6">
        <h2 id="reg-settings-h" className="text-lg font-semibold text-olive-950">Public registration</h2>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor={regId} className="text-sm font-medium text-olive-950">Allow new account registrations</label>
            <p className="mt-1 text-sm text-muted-foreground">
              When off, sign-up buttons are hidden and the registration form is blocked. Existing members still sign in and use their accounts,
              and administrators keep full access. The rest of the website stays open.
            </p>
          </div>
          <Switch id={regId} checked={settings.registrationOpen} disabled={saving} onCheckedChange={toggleRegistration} aria-label="Allow new account registrations" />
        </div>
      </section>
      <section aria-labelledby="offer-settings-h" className="mb-6 max-w-2xl rounded-lg border bg-card p-5 shadow-card sm:p-6">
        <h2 id="offer-settings-h" className="text-lg font-semibold text-olive-950">Business offer approvals</h2>
        <p className="mt-1 text-sm text-muted-foreground">Who must approve a business discount or special offer before it goes public. The person who submits an offer counts as having approved it.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {([
            ["ownerSubmitted", "Offers a business submits itself"],
            ["staffCreated", "Offers staff create for a business"],
          ] as const).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="font-medium text-olive-950">{label}</span>
              <NativeSelect className="mt-1.5" value={settings.offerApproval[key]} disabled={saving} onChange={(e) => setRule(key, e.target.value as ApprovalRule)} aria-label={label}>
                {(Object.keys(RULE_LABEL) as ApprovalRule[]).map((r) => <option key={r} value={r}>{RULE_LABEL[r]}</option>)}
              </NativeSelect>
            </label>
          ))}
        </div>
      </section>
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
      <section aria-labelledby="demo-settings-h" className="mt-6 max-w-2xl rounded-lg border bg-card p-5 shadow-card sm:p-6">
        <h2 id="demo-settings-h" className="text-lg font-semibold text-olive-950">Demo data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything you change in this preview — listings, plans, requests, badges, campaigns — is stored in this browser only. Reset to start again from the original sample data.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => setConfirmReset(true)}>Reset demo data</Button>
      </section>
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        destructive
        title="Reset all demo data?"
        description="Every change made in this browser is discarded and the original sample data comes back. You stay signed in."
        confirmLabel="Reset demo data"
        busyLabel="Resetting…"
        successMessage="Demo data restored"
        onConfirm={() => resetAllDemoData()}
      />
    </>
  );
}
