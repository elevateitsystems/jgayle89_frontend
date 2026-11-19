"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";

/** Reject with a reason shown to the business and (staff only) internal notes that the business never sees. */
export function RejectOfferDialog({
  open, onOpenChange, title, side, onReject,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  side: "staff" | "owner";
  onReject: (reason: string, staffNotes: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (reason.trim().length < 5) return setError("Give a short reason (at least 5 characters).");
    setBusy(true);
    try {
      await onReject(reason, notes);
      setReason("");
      setNotes("");
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reject “{title}”?</DialogTitle>
          <DialogDescription>{side === "staff" ? "The business sees your reason and can ask to speak with staff." : "Staff see your reason. The offer won't be published."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField label={side === "staff" ? "Reason (shown to the business)" : "Reason"} htmlFor="rej-reason" error={error ?? undefined} required>
            <Textarea id="rej-reason" rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setError(null); }} />
          </FormField>
          {side === "staff" && (
            <FormField label="Internal staff notes" htmlFor="rej-notes" hint="Only staff and administrators can see these.">
              <Textarea id="rej-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </FormField>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-destructive text-white hover:bg-destructive/90">{busy ? <><Loader2 className="animate-spin" /> Rejecting…</> : "Reject offer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
