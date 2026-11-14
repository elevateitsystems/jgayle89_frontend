"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronLeft, Info, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { CampaignPreview } from "./campaign-preview";
import { PageHeader } from "@/components/admin/page-header";
import { ImageUpload } from "@/components/admin/image-upload";
import { NoBusinesses } from "@/components/business/business-picker";
import { Panel } from "@/components/dashboard/panel";
import { EmptyState } from "@/components/shared/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { US_STATES } from "@/data/us-states";
import { useAdProducts, useCampaigns, useCredits } from "@/features/advertising/hooks";
import { credits as creditRules } from "@/features/advertising/rules";
import { useOwnedBusinesses } from "@/features/business/hooks";
import { formatPrice } from "@/features/membership/access";
import { useCategories } from "@/hooks/use-categories";
import { usePublishedEvents } from "@/hooks/use-events";
import { useSession } from "@/hooks/use-session";
import { daysFromToday, formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import { campaignSchemaFor, type CampaignFormValues } from "@/schemas/campaign";
import { adService } from "@/services/ad-service";
import { resourceService } from "@/services/resource-service";
import type { AdCampaign, AdProduct, Business } from "@/types";

/** /dashboard/campaigns/new?product=… (or ?edit=… to revise a campaign staff sent back). */
export function CampaignBuilder() {
  const params = useSearchParams();
  const products = useAdProducts();
  const campaigns = useCampaigns();
  const user = useSession();
  const { businesses, loading } = useOwnedBusinesses(user?.id);

  const editing = campaigns.find((c) => c.id === params.get("edit") && c.ownerId === user?.id);
  const product = products.find((p) => p.id === (editing?.productId ?? params.get("product")));

  if (loading) return <Skeleton className="h-96 w-full" />;
  if (businesses.length === 0) return <NoBusinesses />;
  if (!product || (editing && editing.status !== "changes_requested")) {
    return (
      <EmptyState title={editing ? "This campaign can't be edited" : "Choose a product first"} description={editing ? "Only campaigns where staff requested changes can be revised." : "Pick an advertising or sponsorship product to start a campaign."}>
        <Link href="/dashboard/advertising" className={cn(buttonVariants(), "mt-6")}>Browse products</Link>
      </EmptyState>
    );
  }
  return <BuilderForm key={editing?.id ?? product.id} product={product} businesses={businesses} editing={editing} />;
}

function BuilderForm({ product, businesses, editing }: { product: AdProduct; businesses: Business[]; editing?: AdCampaign }) {
  const router = useRouter();
  const user = useSession();
  const { categories } = useCategories();
  const { events } = usePublishedEvents();
  const credits = useCredits();
  const resources = useMemo(() => resourceService.byKinds(["community", "career"]), []);
  const schema = useMemo(() => campaignSchemaFor(product), [product]);
  const [done, setDone] = useState<AdCampaign | null>(null);
  const earliest = daysFromToday(2);

  const {
    register, control, handleSubmit, setValue,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      businessId: editing?.businessId ?? businesses.find((b) => b.status === "active")?.id ?? "",
      name: editing?.name ?? "",
      durationDays: String(editing?.durationDays ?? product.durations[0]?.days ?? ""),
      requestedStart: editing && editing.requestedStart >= earliest ? editing.requestedStart : earliest,
      categoryIds: editing?.targeting.categoryIds ?? [],
      states: editing?.targeting.states ?? [],
      city: editing?.targeting.city ?? "",
      eventId: editing?.targeting.eventId ?? "",
      resourceId: editing?.targeting.resourceId ?? "",
      headline: editing?.creative.headline ?? "",
      body: editing?.creative.body ?? "",
      ctaLabel: editing?.creative.ctaLabel ?? "",
      ctaUrl: editing?.creative.ctaUrl ?? "",
      image: editing?.creative.image ?? "",
      logo: editing?.creative.logo ?? "",
    },
  });
  const v = useWatch({ control });

  const business = businesses.find((b) => b.id === v.businessId);
  const option = product.durations.find((d) => String(d.days) === v.durationDays);
  const credit = business ? creditRules.balance(credits, business.id, daysFromToday(0)) : 0;
  const creditUsed = Math.min(credit, option?.price ?? 0);
  const err = errors as Record<string, { message?: string } | undefined>;

  async function onSubmit(f: CampaignFormValues) {
    if (!user) return;
    const input = {
      name: f.name,
      durationDays: Number(f.durationDays),
      requestedStart: f.requestedStart,
      targeting: { categoryIds: f.categoryIds, states: f.states, city: f.city.trim(), eventId: f.eventId, resourceId: f.resourceId },
      creative: { headline: f.headline.trim(), body: f.body.trim(), ctaLabel: f.ctaLabel.trim(), ctaUrl: f.ctaUrl.trim(), image: f.image, logo: f.logo },
    };
    try {
      const result = editing
        ? await adService.resubmit(editing.id, input, user)
        : await adService.submit({ ...input, productId: product.id, businessId: f.businessId }, user);
      setDone(result);
    } catch (e) {
      toast.error("Couldn't submit the campaign", { description: e instanceof Error ? e.message : undefined });
    }
  }

  if (done) {
    const back = product.family === "sponsorship" ? "/dashboard/sponsorships" : "/dashboard/advertising";
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-12 text-center" role="status">
        <span className="flex size-16 items-center justify-center rounded-full bg-olive-100 text-olive-700"><CheckCircle2 className="size-8" aria-hidden /></span>
        <h1 className="text-2xl font-semibold text-olive-950">Campaign submitted for review</h1>
        <p className="text-muted-foreground">“{done.name}” is with our team. Nothing is charged yet.</p>
        <ol className="w-full rounded-lg border bg-card p-5 text-left text-sm shadow-card">
          {["Staff review your creative (usually 1–2 business days).", "If approved, you complete payment through Stripe Checkout.", "Staff schedule your start date and it goes live, labelled as sponsored."].map((s, i) => (
            <li key={s} className="flex gap-3 py-1.5"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-olive-100 text-xs font-semibold text-olive-800">{i + 1}</span>{s}</li>
          ))}
        </ol>
        <Link href={back} className={buttonVariants({ size: "lg" })}>View my campaigns</Link>
      </div>
    );
  }

  return (
    <>
      <Link href={product.family === "sponsorship" ? "/dashboard/sponsorships" : "/dashboard/advertising"} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-olive-700 hover:underline"><ChevronLeft className="size-4" aria-hidden /> Back to {product.family === "sponsorship" ? "sponsorships" : "advertisements"}</Link>
      <PageHeader title={editing ? `Revise: ${editing.name}` : product.name} description={product.description} />
      {editing?.reviewNote && (
        <p className="mb-6 flex items-start gap-2 rounded-md border border-brass/40 bg-brass-soft px-3 py-2.5 text-sm text-sand-700"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /><span><strong>Staff note:</strong> {editing.reviewNote}</span></p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Panel title="1 · Campaign">
            <div className="space-y-4">
              <FormField label="Business" htmlFor="cb-biz" error={err.businessId?.message} required>
                <NativeSelect id="cb-biz" disabled={!!editing} {...register("businessId")}>
                  {businesses.map((b) => <option key={b.id} value={b.id} disabled={b.status !== "active"}>{b.name}{b.status !== "active" ? " (not published)" : ""}</option>)}
                </NativeSelect>
              </FormField>
              <FormField label="Campaign name" htmlFor="cb-name" error={err.name?.message} hint="Only you and our reviewers see this." required>
                <Input id="cb-name" aria-invalid={!!err.name} aria-describedby={describedBy("cb-name", err.name?.message)} {...register("name")} />
              </FormField>
              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-olive-950">Duration <span className="text-destructive" aria-hidden>*</span></legend>
                <Controller control={control} name="durationDays" render={({ field }) => (
                  <div role="radiogroup" aria-label="Duration" className="grid gap-2 sm:grid-cols-3">
                    {product.durations.map((d) => (
                      <label key={d.days} className={cn("flex cursor-pointer flex-col rounded-md border bg-white p-3 has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50", field.value === String(d.days) ? "border-olive-600 bg-olive-50 ring-1 ring-olive-600" : "hover:bg-sand-100")}>
                        <input type="radio" className="sr-only" name="duration" value={d.days} checked={field.value === String(d.days)} onChange={() => field.onChange(String(d.days))} />
                        <span className="text-sm font-semibold text-olive-950">{d.days} days</span>
                        <span className="text-lg font-semibold tabular-nums text-olive-800">{formatPrice(d.price)}</span>
                      </label>
                    ))}
                  </div>
                )} />
              </fieldset>
              <FormField label="Requested start date" htmlFor="cb-start" error={err.requestedStart?.message} hint="Staff confirm the final start date after approval." required>
                <Input id="cb-start" type="date" min={earliest} aria-invalid={!!err.requestedStart} {...register("requestedStart")} />
              </FormField>
            </div>
          </Panel>

          {product.targeting !== "none" && (
            <Panel title="2 · Targeting">
              <Targeting product={product} control={control} errors={err} categories={categories} events={events.map((e) => ({ id: e.id, label: `${e.title} · ${formatDate(e.date)}` }))} resources={resources.map((r) => ({ id: r.id, label: r.title }))} register={register} setValue={setValue} />
            </Panel>
          )}

          <Panel title={`${product.targeting === "none" ? 2 : 3} · Creative`}>
            <div className="space-y-4">
              <FormField label="Headline" htmlFor="cb-headline" error={err.headline?.message} required>
                <Input id="cb-headline" maxLength={70} aria-invalid={!!err.headline} aria-describedby={describedBy("cb-headline", err.headline?.message)} {...register("headline")} />
              </FormField>
              <FormField label="Supporting text" htmlFor="cb-body" error={err.body?.message}>
                <Textarea id="cb-body" rows={2} maxLength={160} {...register("body")} />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Button text" htmlFor="cb-cta" error={err.ctaLabel?.message}><Input id="cb-cta" placeholder="Learn more" {...register("ctaLabel")} /></FormField>
                <FormField label="Button link" htmlFor="cb-url" error={err.ctaUrl?.message}><Input id="cb-url" type="url" placeholder="https://" aria-invalid={!!err.ctaUrl} {...register("ctaUrl")} /></FormField>
              </div>
              {product.needsImage && (
                <Controller control={control} name="image" render={({ field }) => <ImageUpload id="cb-image" label="Promotional image" value={field.value} onChange={field.onChange} error={err.image?.message} hint={product.imageSpec} />} />
              )}
              {product.needsLogo && (
                <Controller control={control} name="logo" render={({ field }) => <ImageUpload id="cb-logo" label="Logo" aspect="square" value={field.value} onChange={field.onChange} error={err.logo?.message} hint={product.imageSpec} />} />
              )}
              <p className="text-xs text-muted-foreground">Every placement is labelled “{product.label}” on the public site.</p>
            </div>
          </Panel>
        </div>

        <aside className="space-y-6 lg:col-span-2">
          <div className="space-y-6 lg:sticky lg:top-24">
            <CampaignPreview product={product} business={business} creative={{ headline: v.headline ?? "", body: v.body ?? "", ctaLabel: v.ctaLabel ?? "", ctaUrl: v.ctaUrl ?? "", image: v.image ?? "", logo: v.logo ?? "" }} />
            <Panel title="Summary">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Product</dt><dd className="text-right font-medium">{product.name}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Duration</dt><dd>{option ? `${option.days} days` : "—"}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Price</dt><dd className="tabular-nums">{option ? formatPrice(option.price) : "—"}</dd></div>
                {credit > 0 && <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Promotional credit</dt><dd className="tabular-nums text-olive-700">−{formatPrice(creditUsed)}</dd></div>}
                <div className="flex justify-between gap-4 border-t pt-2 text-base font-semibold"><dt>Due after approval</dt><dd className="tabular-nums">{option ? formatPrice(Math.max(0, option.price - creditUsed)) : "—"}</dd></div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">You pay only after staff approve the campaign. Advertising is billed separately from your membership.</p>
              <Button type="submit" size="lg" className="mt-4 w-full" disabled={isSubmitting}>
                {isSubmitting ? <><Loader2 className="animate-spin" /> Submitting…</> : editing ? "Resubmit for review" : "Submit for review"}
              </Button>
              <Button type="button" variant="ghost" className="mt-2 w-full" onClick={() => router.back()}>Cancel</Button>
            </Panel>
          </div>
        </aside>
      </form>
    </>
  );
}

type Opt = { id: string; label: string };

function Targeting({ product, control, errors, categories, events, resources, register, setValue }: {
  product: AdProduct;
  control: ReturnType<typeof useForm<CampaignFormValues>>["control"];
  errors: Record<string, { message?: string } | undefined>;
  categories: { id: string; name: string }[];
  events: Opt[];
  resources: Opt[];
  register: ReturnType<typeof useForm<CampaignFormValues>>["register"];
  setValue: ReturnType<typeof useForm<CampaignFormValues>>["setValue"];
}) {
  if (product.targeting === "category") {
    return (
      <Controller control={control} name="categoryIds" render={({ field }) => (
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-olive-950">Categories <span className="text-destructive" aria-hidden>*</span></legend>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const on = field.value.includes(c.id);
              return (
                <button key={c.id} type="button" aria-pressed={on} onClick={() => field.onChange(on ? field.value.filter((x) => x !== c.id) : [...field.value, c.id])} className={cn("rounded-full px-3 py-1.5 text-sm font-medium transition-colors", on ? "bg-olive-700 text-white" : "bg-sand-100 text-olive-900 hover:bg-sand-200")}>
                  {c.name}
                </button>
              );
            })}
          </div>
          {errors.categoryIds && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.categoryIds.message}</p>}
        </fieldset>
      )} />
    );
  }
  if (product.targeting === "geo") {
    return (
      <div className="space-y-4">
        <Controller control={control} name="states" render={({ field }) => (
          <div>
            <FormField label="States" htmlFor="cb-state" error={errors.states?.message} required>
              <NativeSelect id="cb-state" value="" onChange={(e) => e.target.value && !field.value.includes(e.target.value) && field.onChange([...field.value, e.target.value])}>
                <option value="">Add a state…</option>
                {US_STATES.filter((s) => !field.value.includes(s.code)).map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </NativeSelect>
            </FormField>
            {field.value.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2" aria-label="Selected states">
                {field.value.map((code) => (
                  <li key={code}><button type="button" onClick={() => field.onChange(field.value.filter((x) => x !== code))} className="inline-flex items-center gap-1.5 rounded-full bg-olive-100 px-3 py-1.5 text-xs font-medium text-olive-900 hover:bg-olive-200">{US_STATES.find((s) => s.code === code)?.name ?? code} <X className="size-3" aria-label="Remove" /></button></li>
                ))}
              </ul>
            )}
          </div>
        )} />
        <FormField label="City (optional)" htmlFor="cb-city"><Input id="cb-city" {...register("city")} /></FormField>
      </div>
    );
  }
  if (product.targeting === "event") {
    return (
      <FormField label="Event to sponsor" htmlFor="cb-event" error={errors.eventId?.message} required>
        <NativeSelect id="cb-event" aria-invalid={!!errors.eventId} {...register("eventId")} onChange={(e) => setValue("eventId", e.target.value, { shouldValidate: true })}>
          <option value="">Select an event…</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
        </NativeSelect>
      </FormField>
    );
  }
  return (
    <FormField label="Resource to sponsor" htmlFor="cb-resource" error={errors.resourceId?.message} required>
      <NativeSelect id="cb-resource" aria-invalid={!!errors.resourceId} {...register("resourceId")} onChange={(e) => setValue("resourceId", e.target.value, { shouldValidate: true })}>
        <option value="">Select a resource…</option>
        {resources.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
      </NativeSelect>
    </FormField>
  );
}
