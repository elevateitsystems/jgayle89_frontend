"use client";

import { useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Info, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ChangeDiff } from "./change-diff";
import { AttachmentUploader, type StoredFile } from "@/components/shared/attachment-uploader";
import { Button } from "@/components/ui/button";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { editableSnapshot, effectiveChanges, changedKeys } from "@/features/business/changes";
import { useSession } from "@/hooks/use-session";
import { newId } from "@/lib/slug";
import { SOCIAL_PLATFORMS, editRequestSchema, type EditRequestFormValues } from "@/schemas/edit-request";
import { editRequestService } from "@/services/edit-request-service";
import type { Business, BusinessChanges, BusinessEditRequest, EditableBusinessFields, EditableFieldKey, Promotion, SocialLink } from "@/types";

export type EditSection = "details" | "social" | "promotions";

const FIELD_GROUPS: Record<EditSection, EditableFieldKey[]> = {
  details: ["name", "tagline", "description", "services", "phone", "email", "website", "hours", "address", "city", "state", "zip"],
  social: ["socialLinks"],
  promotions: ["promotions"],
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  business: Business;
  sections?: EditSection[];
  /** Revising a request staff sent back. */
  request?: BusinessEditRequest;
  /** Plan limits for social links / promotions (null = unlimited). */
  caps: { socialLinks: number | null; promotions: number | null };
}

const SECTION_TITLE: Record<EditSection, string> = { details: "Business details", social: "Social media links", promotions: "Discounts & promotions" };

function toFormValues(current: EditableBusinessFields, overrides: BusinessChanges = {}): EditRequestFormValues {
  const merged = { ...current, ...overrides };
  return {
    name: merged.name, tagline: merged.tagline, description: merged.description, services: merged.services.join(", "),
    phone: merged.phone, email: merged.email, website: merged.website, hours: merged.hours, address: merged.address,
    city: merged.city, state: merged.state, zip: merged.zip,
    socialLinks: merged.socialLinks.map((l) => ({ platform: l.platform, url: l.url, label: l.label ?? "" })),
    promotions: merged.promotions.map((p) => ({ id: p.id, title: p.title, discountText: p.discountText, description: p.description, audience: p.audience, validUntil: p.validUntil ?? "" })),
    reason: "",
  };
}

/** Form values → the proposed changes for the sections being edited (trimmed, normalised). */
function toProposed(v: Partial<EditRequestFormValues>, sections: EditSection[]): BusinessChanges {
  const out: Record<string, unknown> = {};
  const has = (s: EditSection) => sections.includes(s);
  if (has("details")) {
    for (const k of ["name", "tagline", "description", "phone", "email", "website", "hours", "address", "city", "zip"] as const) out[k] = (v[k] ?? "").trim();
    out.state = (v.state ?? "").trim().toUpperCase();
    out.services = (v.services ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  }
  if (has("social")) {
    out.socialLinks = (v.socialLinks ?? []).map((l): SocialLink => ({ platform: l.platform, url: l.url.trim(), ...(l.label?.trim() ? { label: l.label.trim() } : {}) }));
  }
  if (has("promotions")) {
    out.promotions = (v.promotions ?? []).map((p): Promotion => ({ id: p.id, title: p.title.trim(), discountText: p.discountText.trim(), description: p.description.trim(), audience: p.audience, ...(p.validUntil ? { validUntil: p.validUntil } : {}) }));
  }
  return out as BusinessChanges;
}

/**
 * Owner → "Request an edit". Owners never edit the listing: this builds a request (with a live before/after
 * preview and optional supporting images) that goes to the staff review queue.
 */
export function EditRequestForm({ open, onOpenChange, ...rest }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-2xl">
        {/* The body mounts fresh each time the sheet opens, so form state never leaks between requests. */}
        {open && <EditRequestBody onOpenChange={onOpenChange} {...rest} />}
      </SheetContent>
    </Sheet>
  );
}

function EditRequestBody({ onOpenChange, business, sections = ["details", "social", "promotions"], request, caps }: Omit<Props, "open">) {
  const user = useSession();
  const snapshot = useMemo(() => editableSnapshot(business), [business]);
  const [files, setFiles] = useState<StoredFile[]>(request?.attachments ?? []);
  const [submitted, setSubmitted] = useState<BusinessEditRequest | null>(null);

  const schema = useMemo(() => {
    const keys = [...sections.flatMap((s) => FIELD_GROUPS[s]), "reason"];
    return editRequestSchema.pick(Object.fromEntries(keys.map((k) => [k, true])) as never) as unknown as typeof editRequestSchema;
  }, [sections]);

  const {
    register, control, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditRequestFormValues>({ resolver: zodResolver(schema), defaultValues: { ...toFormValues(snapshot, request?.changes), reason: request?.reason ?? "" } });

  const links = useFieldArray({ control, name: "socialLinks" });
  const promos = useFieldArray({ control, name: "promotions" });
  const watched = useWatch({ control });

  const proposed = useMemo(() => effectiveChanges(snapshot, toProposed(watched as EditRequestFormValues, sections)), [watched, snapshot, sections]);
  const before = useMemo(() => Object.fromEntries(changedKeys(proposed).map((k) => [k, snapshot[k]])) as BusinessChanges, [proposed, snapshot]);
  const hasChanges = changedKeys(proposed).length > 0;
  const linkLimitReached = caps.socialLinks !== null && links.fields.length >= caps.socialLinks;
  const promoLimitReached = caps.promotions !== null && promos.fields.length >= caps.promotions;

  async function onSubmit(v: EditRequestFormValues) {
    if (!user) return;
    try {
      const input = { reason: v.reason, changes: effectiveChanges(snapshot, toProposed(v, sections)), attachments: files, caps };
      const result = request
        ? await editRequestService.resubmit(request.id, input, user)
        : await editRequestService.submit({ ...input, businessId: business.id }, user);
      setSubmitted(result);
    } catch (e) {
      toast.error("Couldn't submit the request", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const err = errors as Record<string, { message?: string } | undefined>;
  const field = (name: keyof EditRequestFormValues, label: string, opts: { type?: string; hint?: string; textarea?: boolean; maxLength?: number; required?: boolean } = {}) => (
    <FormField label={label} htmlFor={`er-${name}`} error={err[name]?.message} hint={opts.hint} required={opts.required ?? true} className={opts.textarea ? "sm:col-span-2" : undefined}>
      {opts.textarea ? (
        <Textarea id={`er-${name}`} rows={5} aria-invalid={!!err[name]} aria-describedby={describedBy(`er-${name}`, err[name]?.message, opts.hint)} {...register(name as "description")} />
      ) : (
        <Input id={`er-${name}`} type={opts.type} aria-invalid={!!err[name]} aria-describedby={describedBy(`er-${name}`, err[name]?.message, opts.hint)} {...register(name as "name")} />
      )}
    </FormField>
  );

  return (
    <>
        {submitted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center" role="status">
            <span className="flex size-16 items-center justify-center rounded-full bg-olive-100 text-olive-700"><CheckCircle2 className="size-8" aria-hidden /></span>
            <h2 className="text-2xl font-semibold text-olive-950">Request submitted</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Staff will review your request for <strong>{business.name}</strong>. Your public listing stays exactly as it is until a staff member approves the change.
            </p>
            <dl className="w-full max-w-sm rounded-md border bg-white p-4 text-left text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Reference</dt><dd className="font-mono text-xs">{submitted.id}</dd></div>
              <div className="mt-2 flex justify-between gap-3"><dt className="text-muted-foreground">Fields changed</dt><dd>{changedKeys(submitted.changes).length}</dd></div>
              <div className="mt-2 flex justify-between gap-3"><dt className="text-muted-foreground">Status</dt><dd>Pending review</dd></div>
            </dl>
            <Button size="lg" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <>
            <SheetHeader className="border-b border-sand-200 p-5">
              <SheetTitle>{request ? "Revise your request" : "Request an edit"} — {business.name}</SheetTitle>
              <SheetDescription>Changes are reviewed by Mission: SITREP staff before they appear on your public listing.</SheetDescription>
            </SheetHeader>

            <form id="edit-request-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-8 overflow-y-auto p-5">
              {request?.reviewNote && (
                <p className="flex items-start gap-2 rounded-md border border-brass/40 bg-brass-soft px-3 py-2.5 text-sm text-sand-700">
                  <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> <span><strong>Staff note:</strong> {request.reviewNote}</span>
                </p>
              )}

              {sections.includes("details") && (
                <fieldset className="space-y-4">
                  <legend className="mb-1 font-heading text-lg font-semibold text-olive-950">{SECTION_TITLE.details}</legend>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {field("name", "Business name")}
                    {field("tagline", "Tagline")}
                    {field("description", "Description", { textarea: true })}
                    {field("services", "Services", { hint: "Separate services with commas.", required: false })}
                    {field("hours", "Hours", { required: false })}
                    {field("phone", "Phone", { type: "tel" })}
                    {field("email", "Email", { type: "email" })}
                    {field("website", "Website", { type: "url", required: false })}
                    {field("address", "Street address")}
                    {field("city", "City")}
                    {field("state", "State (2 letters)")}
                    {field("zip", "ZIP code")}
                  </div>
                </fieldset>
              )}

              {sections.includes("social") && (
                <fieldset className="space-y-4">
                  <legend className="mb-1 font-heading text-lg font-semibold text-olive-950">{SECTION_TITLE.social}</legend>
                  <p className="text-xs text-muted-foreground">Facebook, Instagram, LinkedIn, YouTube and other websites. {caps.socialLinks !== null ? `Your plan allows up to ${caps.socialLinks}.` : "Your plan allows unlimited links."}</p>
                  <ul className="space-y-3">
                    {links.fields.map((f, i) => {
                      const e = (errors.socialLinks?.[i] ?? {}) as Record<string, { message?: string }>;
                      const platform = watched.socialLinks?.[i]?.platform;
                      return (
                        <li key={f.id} className="grid gap-3 rounded-md border bg-white p-3 sm:grid-cols-[150px_1fr_auto]">
                          <FormField label="Platform" htmlFor={`sl-p-${i}`}>
                            <NativeSelect id={`sl-p-${i}`} {...register(`socialLinks.${i}.platform` as const)}>
                              {SOCIAL_PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </NativeSelect>
                          </FormField>
                          <div className="space-y-3">
                            <FormField label="Address" htmlFor={`sl-u-${i}`} error={e.url?.message}>
                              <Input id={`sl-u-${i}`} type="url" placeholder={SOCIAL_PLATFORMS.find((p) => p.id === platform)?.placeholder} aria-invalid={!!e.url} {...register(`socialLinks.${i}.url` as const)} />
                            </FormField>
                            {platform === "website" && (
                              <FormField label="Link name" htmlFor={`sl-l-${i}`} error={e.label?.message}>
                                <Input id={`sl-l-${i}`} placeholder="e.g. Online store" aria-invalid={!!e.label} {...register(`socialLinks.${i}.label` as const)} />
                              </FormField>
                            )}
                          </div>
                          <Button type="button" variant="ghost" size="icon-sm" className="self-start sm:mt-6" aria-label={`Remove link ${i + 1}`} onClick={() => links.remove(i)}><Trash2 /></Button>
                        </li>
                      );
                    })}
                  </ul>
                  <Button type="button" variant="outline" size="sm" disabled={linkLimitReached} onClick={() => links.append({ platform: "facebook", url: "", label: "" })}>
                    <Plus /> Add a link
                  </Button>
                  {linkLimitReached && <p className="text-xs text-muted-foreground">You&apos;ve reached your plan&apos;s link limit.</p>}
                </fieldset>
              )}

              {sections.includes("promotions") && (
                <fieldset className="space-y-4">
                  <legend className="mb-1 font-heading text-lg font-semibold text-olive-950">{SECTION_TITLE.promotions}</legend>
                  <p className="text-xs text-muted-foreground">{caps.promotions === 0 ? "Your plan doesn't include promotions." : caps.promotions !== null ? `Your plan allows up to ${caps.promotions} active promotion${caps.promotions === 1 ? "" : "s"}.` : "Your plan allows unlimited promotions."}</p>
                  <ul className="space-y-3">
                    {promos.fields.map((f, i) => {
                      const e = (errors.promotions?.[i] ?? {}) as Record<string, { message?: string }>;
                      return (
                        <li key={f.id} className="space-y-3 rounded-md border bg-white p-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <FormField label="Title" htmlFor={`pr-t-${i}`} error={e.title?.message}><Input id={`pr-t-${i}`} aria-invalid={!!e.title} {...register(`promotions.${i}.title` as const)} /></FormField>
                            <FormField label="Discount" htmlFor={`pr-d-${i}`} error={e.discountText?.message}><Input id={`pr-d-${i}`} placeholder="10% off" aria-invalid={!!e.discountText} {...register(`promotions.${i}.discountText` as const)} /></FormField>
                          </div>
                          <FormField label="Details" htmlFor={`pr-x-${i}`} error={e.description?.message}><Textarea id={`pr-x-${i}`} rows={2} aria-invalid={!!e.description} {...register(`promotions.${i}.description` as const)} /></FormField>
                          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                            <FormField label="Who qualifies" htmlFor={`pr-a-${i}`}>
                              <NativeSelect id={`pr-a-${i}`} {...register(`promotions.${i}.audience` as const)}>
                                <option value="veterans">Veterans &amp; military</option>
                                <option value="first_responders">First responders</option>
                                <option value="everyone">Everyone</option>
                              </NativeSelect>
                            </FormField>
                            <FormField label="Valid until (optional)" htmlFor={`pr-v-${i}`}><Input id={`pr-v-${i}`} type="date" {...register(`promotions.${i}.validUntil` as const)} /></FormField>
                            <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remove promotion ${i + 1}`} onClick={() => promos.remove(i)}><Trash2 /></Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <Button type="button" variant="outline" size="sm" disabled={promoLimitReached || caps.promotions === 0} onClick={() => promos.append({ id: newId("promo"), title: "", discountText: "", description: "", audience: "veterans", validUntil: "" })}>
                    <Plus /> Add a promotion
                  </Button>
                  {promoLimitReached && caps.promotions !== 0 && <p className="text-xs text-muted-foreground">You&apos;ve reached your plan&apos;s promotion limit.</p>}
                </fieldset>
              )}

              <section aria-labelledby="er-preview" className="space-y-3">
                <h3 id="er-preview" className="font-heading text-lg font-semibold text-olive-950">Requested changes preview</h3>
                <ChangeDiff before={before} changes={proposed} emptyLabel="Edit a field above and your changes will appear here." />
              </section>

              <section className="space-y-4">
                <h3 className="font-heading text-lg font-semibold text-olive-950">Supporting information</h3>
                <FormField label="Why are you requesting this change?" htmlFor="er-reason" error={err.reason?.message} required>
                  <Textarea id="er-reason" rows={3} aria-invalid={!!err.reason} aria-describedby={describedBy("er-reason", err.reason?.message)} {...register("reason")} />
                </FormField>
                <Controller
                  control={control}
                  name="reason"
                  render={() => <AttachmentUploader id="er-files" label="Supporting images (optional)" value={files} onChange={setFiles} accept="images" max={4} hint="Photos of signage, menus or documents that back up the change." />}
                />
              </section>
            </form>

            <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-sand-200 p-4">
              <p className="hidden text-xs text-muted-foreground sm:block">{hasChanges ? `${changedKeys(proposed).length} field${changedKeys(proposed).length === 1 ? "" : "s"} changed` : "No changes yet"}</p>
              <div className="ml-auto flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" form="edit-request-form" disabled={isSubmitting || !hasChanges}>
                  {isSubmitting ? <><Loader2 className="animate-spin" /> Submitting…</> : request ? "Resubmit for review" : "Submit for review"}
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
    </>
  );
}
