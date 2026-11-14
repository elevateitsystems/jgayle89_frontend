/**
 * PAYMENTS — INTEGRATION PLACEHOLDER. Nothing here charges anyone or marks anything as paid.
 *
 * When the Django backend and Stripe are connected, `createCheckoutSession` should POST the request
 * to the backend, which creates a Stripe Checkout Session and returns its URL:
 *
 *   const res = await fetch(`${API_BASE}/<checkout-endpoint>`, { method: "POST", body: JSON.stringify(req) });
 *   const { url } = await res.json();
 *   return { status: "redirect", url };
 *
 * Subscription / campaign `paymentStatus` must only ever change from a Stripe webhook handled by the backend,
 * never from this frontend. (The endpoint path above is intentionally not invented — define it with the API.)
 */
import { delay } from "@/lib/demo-store";

/** Flip to true only once the backend checkout endpoint exists. */
export const STRIPE_CONFIGURED = false;

export type CheckoutKind = "membership" | "advertising";

export interface CheckoutRequest {
  kind: CheckoutKind;
  description: string;
  /** Amount before credits, USD. */
  amountUsd: number;
  /** Promotional credit that would be applied, USD. */
  creditUsd?: number;
  /** Opaque ids the backend needs (planId, cycle, subjectId, campaignId …). */
  metadata: Record<string, string>;
}

export type CheckoutResult =
  | { status: "redirect"; url: string }
  | { status: "not_configured"; message: string };

export async function createCheckoutSession(req: CheckoutRequest): Promise<CheckoutResult> {
  await delay(500);
  void req; // forwarded to the backend once it exists
  if (!STRIPE_CONFIGURED) {
    return {
      status: "not_configured",
      message: "Stripe Checkout isn't connected yet, so no payment was started and nothing was charged.",
    };
  }
  throw new Error("Stripe is flagged as configured but createCheckoutSession has not been implemented.");
}
