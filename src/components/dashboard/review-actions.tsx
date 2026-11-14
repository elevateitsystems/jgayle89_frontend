"use client";

import { useState } from "react";
import { Check, MessageSquareWarning, X } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Textarea } from "@/components/ui/textarea";

export type Decision = "approve" | "reject" | "request_changes";

interface Props {
  idPrefix: string;
  /** Throw to show an error toast and keep the form open. */
  onDecision: (decision: Decision, note: string) => Promise<void>;
  approveLabel?: string;
  /** Shown in the confirmation dialog before approving (what will happen). */
  approveWarning: React.ReactNode;
  /** Hide "Request changes" where it doesn't apply. */
  allowRequestChanges?: boolean;
  noteHint?: string;
  /** Extra controls shown above the buttons (e.g. a date picker). */
  children?: React.ReactNode;
  /** Return an error message to block approval, or null. */
  validateApprove?: () => string | null;
}

/** Approve / Request changes / Reject with a required note for the latter two and a confirmation before approving. */
export function ReviewActions({ idPrefix, onDecision, approveLabel = "Approve", approveWarning, allowRequestChanges = true, noteHint, children, validateApprove }: Props) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Decision | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function run(decision: Decision) {
    setBusy(decision);
    try {
      await onDecision(decision, note);
      setNote("");
      setError(null);
    } finally {
      setBusy(null);
    }
  }

  function needNote(decision: Decision) {
    if (note.trim().length < 5) {
      setError("Add a short note (5+ characters) so the owner knows what to do next.");
      document.getElementById(`${idPrefix}-note`)?.focus();
      return;
    }
    setError(null);
    run(decision).catch((e) => toast.error("Couldn't save the decision", { description: e instanceof Error ? e.message : undefined }));
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <FormField label="Note to the owner" htmlFor={`${idPrefix}-note`} error={error ?? undefined} hint={noteHint ?? "Required for Reject and Request changes. Optional when approving."}>
        <Textarea id={`${idPrefix}-note`} rows={3} value={note} onChange={(e) => { setNote(e.target.value); setError(null); }} aria-invalid={!!error} />
      </FormField>
      {children}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() => {
            const problem = validateApprove?.();
            if (problem) return setError(problem);
            setConfirming(true);
          }}
          disabled={!!busy}
        >
          <Check /> {approveLabel}
        </Button>
        {allowRequestChanges && (
          <Button variant="outline" onClick={() => needNote("request_changes")} disabled={!!busy}>
            <MessageSquareWarning /> {busy === "request_changes" ? "Sending…" : "Request changes"}
          </Button>
        )}
        <Button variant="destructive" onClick={() => needNote("reject")} disabled={!!busy}>
          <X /> {busy === "reject" ? "Rejecting…" : "Reject"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`${approveLabel}?`}
        description={approveWarning}
        confirmLabel={approveLabel}
        busyLabel="Saving…"
        onConfirm={() => run("approve")}
      />
    </div>
  );
}
