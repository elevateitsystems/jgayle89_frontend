"use client";

import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { BADGE_ICONS, BADGE_TONES } from "./business-badge";
import { PageHeader } from "@/components/admin/page-header";
import { BadgeRequestPill, StatusPill } from "@/components/dashboard/status-pill";
import { BusinessPicker, NoBusinesses, useSelectedBusiness } from "@/components/business/business-picker";
import { AttachmentUploader, type StoredFile } from "@/components/shared/attachment-uploader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";
import { badgeState, type BadgeState } from "@/features/badges/rules";
import { useBadgeAssignments, useBadgeRequests, useBadges } from "@/features/badges/hooks";
import { useOwnedBusinesses } from "@/features/business/hooks";
import { useSession } from "@/hooks/use-session";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { badgeService } from "@/services/badge-service";
import type { Business, BusinessBadge } from "@/types";

/** Owner → Badges & Verification page. */
export function OwnerBadgesPage() {
  const user = useSession();
  const { businesses, loading } = useOwnedBusinesses(user?.id);
  const { selected, setId } = useSelectedBusiness(businesses);
  return (
    <>
      <PageHeader title="Badges & verification" description="Badges are earned through staff review. A paid membership never grants a badge." />
      {!loading && businesses.length === 0 ? <NoBusinesses /> : (
        <>
          <BusinessPicker businesses={businesses} value={selected?.id} onChange={setId} />
          {selected && <OwnerBadgesPanel business={selected} />}
        </>
      )}
    </>
  );
}

const STATE_LABEL: Record<BadgeState, string> = { active: "Verified", pending: "Pending review", rejected: "Rejected", revoked: "Revoked", none: "Not requested" };

export function OwnerBadgesPanel({ business }: { business: Business }) {
  const badges = useBadges().filter((b) => b.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const assignments = useBadgeAssignments();
  const requests = useBadgeRequests();
  const [requesting, setRequesting] = useState<BusinessBadge | null>(null);

  return (
    <>
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {badges.map((b) => {
          const state = badgeState(b.id, business.id, assignments, requests);
          const assignment = assignments.find((a) => a.businessId === business.id && a.badgeId === b.id && a.status === "active");
          const latest = requests.filter((r) => r.businessId === business.id && r.badgeId === b.id).sort((x, y) => y.createdAt.localeCompare(x.createdAt))[0];
          const revoked = assignments.find((a) => a.businessId === business.id && a.badgeId === b.id && a.status === "revoked");
          const Icon = BADGE_ICONS[b.icon];
          return (
            <li key={b.id} className="flex flex-col rounded-lg border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <span className={cn("flex size-11 items-center justify-center rounded-full ring-1 ring-inset", BADGE_TONES[b.tone])}><Icon className="size-5" aria-hidden /></span>
                {state === "pending" && latest ? <BadgeRequestPill status="pending" /> : <StatusPill tone={state === "active" ? "good" : state === "rejected" || state === "revoked" ? "bad" : "neutral"}>{STATE_LABEL[state]}</StatusPill>}
              </div>
              <h3 className="mt-3 font-sans text-base font-semibold text-olive-950">{b.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{b.description}</p>
              <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium text-olive-900">What staff check:</span> {b.criteria}</p>

              <div className="mt-auto pt-4 text-sm">
                {state === "active" && assignment && <p className="text-muted-foreground">Verified {formatDate(assignment.verifiedOn)} by {assignment.verifiedBy}.</p>}
                {state === "pending" && latest && <p className="text-muted-foreground">Submitted {formatDate(latest.createdAt)}. You&apos;ll be notified when staff decide.</p>}
                {state === "rejected" && latest?.reviewNote && <p className="rounded-md bg-destructive/5 p-2 text-xs text-destructive">{latest.reviewNote}</p>}
                {state === "revoked" && revoked?.revokedReason && <p className="rounded-md bg-destructive/5 p-2 text-xs text-destructive">Revoked {revoked.revokedOn ? formatDate(revoked.revokedOn) : ""}: {revoked.revokedReason}</p>}
                {(state === "none" || state === "rejected" || state === "revoked") && (
                  <Button variant="outline" className="mt-3 w-full" onClick={() => setRequesting(b)}>
                    <ShieldCheck /> {state === "none" ? "Request this badge" : "Request again"}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <RequestBadgeDialog business={business} badge={requesting} onClose={() => setRequesting(null)} />
    </>
  );
}

function RequestBadgeDialog({ business, badge, onClose }: { business: Business; badge: BusinessBadge | null; onClose: () => void }) {
  const user = useSession();
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setNote("");
    setFiles([]);
    setError(null);
    onClose();
  }

  async function submit() {
    if (!user || !badge) return;
    if (note.trim().length < 10) return setError("Add a short explanation (10+ characters).");
    if (badge.requiresDocuments && files.length === 0) return setError("Attach at least one supporting document.");
    setBusy(true);
    setError(null);
    try {
      await badgeService.request({ businessId: business.id, badgeId: badge.id, note, documents: files }, user);
      toast.success("Badge request submitted", { description: "Staff will review your documents." });
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit the request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!badge} onOpenChange={(o) => !o && !busy && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Request “{badge?.name}”</DialogTitle>
          <DialogDescription>For {business.name}. Staff review every request; approval is never automatic.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="rounded-md bg-sand-100 p-3 text-xs text-sand-700"><strong>What staff check:</strong> {badge?.criteria}</p>
          <FormField label="Tell us about your business" htmlFor="bq-note" required>
            <Textarea id="bq-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
          <AttachmentUploader id="bq-files" label={badge?.requiresDocuments ? "Supporting documents (required)" : "Supporting documents (optional)"} accept="documents" max={4} value={files} onChange={setFiles} hint="Redact sensitive numbers before uploading." />
          {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy}>{busy ? <><Loader2 className="animate-spin" /> Submitting…</> : "Submit request"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
