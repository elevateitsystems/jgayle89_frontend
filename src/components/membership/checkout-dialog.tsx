"use client";

import { useState } from "react";
import { CreditCard, Info, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/features/membership/access";
import { createCheckoutSession, type CheckoutRequest } from "@/services/payments-service";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: CheckoutRequest | null;
  title?: string;
}

/**
 * Order summary + Stripe Checkout hand-off. INTEGRATION PLACEHOLDER: the "Continue" button calls
 * `createCheckoutSession`, which currently reports that Stripe isn't connected. It never fakes a successful payment.
 */
export function CheckoutDialog({ open, onOpenChange, request, title = "Review your order" }: Props) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function proceed() {
    if (!request) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await createCheckoutSession(request);
      if (result.status === "redirect") window.location.assign(result.url);
      else setMessage(result.message);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Checkout failed to start.");
    } finally {
      setBusy(false);
    }
  }

  const credit = request?.creditUsd ?? 0;
  const total = Math.max(0, (request?.amountUsd ?? 0) - credit);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) setMessage(null); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Payments are handled by Stripe Checkout. You won&apos;t enter card details on this site.</DialogDescription>
        </DialogHeader>

        {request && (
          <dl className="space-y-2 rounded-md border bg-sand-50 p-4 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Item</dt><dd className="text-right font-medium">{request.description}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Subtotal</dt><dd className="tabular-nums">{formatPrice(request.amountUsd)}</dd></div>
            {credit > 0 && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Promotional credit</dt><dd className="tabular-nums text-olive-700">−{formatPrice(credit)}</dd></div>}
            <div className="flex justify-between gap-4 border-t pt-2 text-base font-semibold"><dt>Due today</dt><dd className="tabular-nums">{formatPrice(total)}</dd></div>
          </dl>
        )}

        <p className="flex items-start gap-2 rounded-md border border-brass/40 bg-brass-soft px-3 py-2.5 text-xs text-sand-700">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span><strong>Integration placeholder.</strong> Stripe isn&apos;t connected to this preview, so continuing will not charge you or change your plan.</span>
        </p>

        {message && <p role="status" className="rounded-md border border-sand-300 bg-white px-3 py-2.5 text-sm text-olive-950">{message}</p>}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Close</Button>
          <Button onClick={proceed} disabled={busy || !request}>
            {busy ? <><Loader2 className="animate-spin" /> Starting checkout…</> : <><Lock /> Continue to secure checkout <CreditCard className="hidden" aria-hidden /></>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
