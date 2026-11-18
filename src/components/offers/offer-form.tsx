"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { OFFER_AUDIENCE_LABEL } from "@/features/offers/rules";
import { todayISO } from "@/lib/date";
import type { BusinessOffer, OfferAudience } from "@/types";
import type { OfferInput } from "@/services/offer-service";

const schema = z
  .object({
    title: z.string().trim().min(3, "Add a title").max(100),
    discountText: z.string().trim().min(2, "e.g. “15% off” or “Free consult”").max(40),
    description: z.string().trim().max(400),
    audience: z.string().min(1, "Choose who it's for"),
    startsOn: z.string().min(1, "Choose a start date"),
    expiresOn: z.string(),
  })
  .refine((v) => !v.expiresOn || v.expiresOn >= v.startsOn, { path: ["expiresOn"], message: "The end date must be on or after the start date" });
type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  offer?: BusinessOffer | null;
  /** Explains what happens after saving (who must approve). */
  approvalNote: string;
  /** Extra fields above the form, e.g. the staff business picker. */
  before?: React.ReactNode;
  onSubmit: (input: OfferInput) => Promise<void>;
}

/** Add / edit a business discount or special offer. Saving always (re)submits it for approval. */
export function OfferFormSheet({ open, onOpenChange, offer, approvalNote, before, onSubmit }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", discountText: "", description: "", audience: "veterans_and_first_responders", startsOn: todayISO(), expiresOn: "" },
  });
  useEffect(() => {
    if (!open) return;
    reset(offer
      ? { title: offer.title, discountText: offer.discountText, description: offer.description, audience: offer.audience, startsOn: offer.startsOn, expiresOn: offer.expiresOn ?? "" }
      : { title: "", discountText: "", description: "", audience: "veterans_and_first_responders", startsOn: todayISO(), expiresOn: "" });
  }, [open, offer, reset]);

  async function submit(v: Values) {
    await onSubmit({ ...v, audience: v.audience as OfferAudience, expiresOn: v.expiresOn || undefined });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-sand-200 p-5">
          <SheetTitle>{offer ? "Edit offer" : "New offer"}</SheetTitle>
          <SheetDescription>{approvalNote}</SheetDescription>
        </SheetHeader>
        <form id="offer-form" onSubmit={handleSubmit(submit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          {before}
          <FormField label="Offer title" htmlFor="of-title" error={errors.title?.message} required hint="e.g. “15% Discount for Veterans and First Responders”"><Input id="of-title" {...register("title")} /></FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Discount" htmlFor="of-disc" error={errors.discountText?.message} required><Input id="of-disc" placeholder="15% off" {...register("discountText")} /></FormField>
            <FormField label="Who it's for" htmlFor="of-aud" error={errors.audience?.message} required>
              <NativeSelect id="of-aud" {...register("audience")}>{(Object.keys(OFFER_AUDIENCE_LABEL) as OfferAudience[]).map((a) => <option key={a} value={a}>{OFFER_AUDIENCE_LABEL[a].replace("For ", "")}</option>)}</NativeSelect>
            </FormField>
          </div>
          <FormField label="Details" htmlFor="of-desc" error={errors.description?.message}><Textarea id="of-desc" rows={3} {...register("description")} /></FormField>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Starts" htmlFor="of-start" error={errors.startsOn?.message} required><Input id="of-start" type="date" {...register("startsOn")} /></FormField>
            <FormField label="Ends (temporary deals)" htmlFor="of-end" error={errors.expiresOn?.message} hint="Optional — shows a public countdown."><Input id="of-end" type="date" {...register("expiresOn")} /></FormField>
          </div>
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="offer-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Submitting…</> : offer ? "Save & resubmit" : "Submit offer"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Plain-language summary of the current rule, shown before submitting. */
export function approvalNoteFor(requires: ("staff" | "owner")[]): string {
  if (requires.length === 0) return "With the current approval rule this offer goes live on its start date as soon as you save it.";
  const who = requires.map((s) => (s === "staff" ? "Mission: SITREP staff" : "the business owner")).join(" and ");
  return `After you save, ${who} must approve it before it's public.`;
}
