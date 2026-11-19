"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { AuditLogPanel } from "./audit-log";
import { ImageUpload } from "./image-upload";
import { PageHeader } from "./page-header";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/features/membership/access";
import { useAllPlans } from "@/features/membership/hooks";
import { PROMOTION_KIND_LABEL, describePromotion } from "@/features/services/pricing";
import { useSession } from "@/hooks/use-session";
import { useStore } from "@/hooks/use-store";
import { formatDate, todayISO } from "@/lib/date";
import { hasPermission } from "@/lib/permissions";
import { AUDIENCE_LABEL } from "@/lib/mock-data/membership";
import { marketplaceService, promotionStore, serviceStore } from "@/services/marketplace-service";
import type { PromotionKind, ServiceAudience, ServiceAvailability, ServiceListing, ServicePromotion } from "@/types";


/** Admin → Services Marketplace (client update §6). Catalogue, Coming Soon, tier assignment and promotions. */
export function ServicesAdmin() {
  const user = useSession();
  const canServices = hasPermission(user, "services.manage");
  const canDiscounts = hasPermission(user, "services.discounts");
  return (
    <>
      <PageHeader title="Services marketplace" description="Individual member services and business services. Coming Soon services are visible to members but can't be bought until activated." />
      <Tabs defaultValue={canServices ? "services" : "promotions"}>
        <TabsList className="mb-4 h-auto max-w-full flex-wrap justify-start p-1">
          {canServices && <TabsTrigger value="services" className="h-9 px-4">Services</TabsTrigger>}
          <TabsTrigger value="promotions" className="h-9 px-4">Promotions &amp; coupons</TabsTrigger>
          <TabsTrigger value="history" className="h-9 px-4">Change history</TabsTrigger>
        </TabsList>
        {canServices && <TabsContent value="services"><ServicesTable /></TabsContent>}
        <TabsContent value="promotions"><PromotionsTable canApprove={canDiscounts} /></TabsContent>
        <TabsContent value="history"><AuditLogPanel areas={["services", "promotions"]} limit={25} /></TabsContent>
      </Tabs>
    </>
  );
}

function ServicesTable() {
  const user = useSession();
  const services = useStore(serviceStore);
  const plans = useAllPlans();
  const [audience, setAudience] = useState("");
  const [editing, setEditing] = useState<ServiceListing | "new" | null>(null);
  const rows = useMemo(() => services.filter((s) => !audience || s.audience === audience), [services, audience]);

  async function setAvailability(s: ServiceListing, availability: ServiceAvailability) {
    if (!user) return;
    try {
      await marketplaceService.updateService(s.id, { availability }, user);
      toast.success(availability === "coming_soon" ? "Marked Coming Soon" : availability === "active" ? "Service activated" : "Service deactivated");
    } catch (e) {
      toast.error("Couldn't update", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const columns: Column<ServiceListing>[] = [
    { id: "name", header: "Service", sort: (s) => s.name, cell: (s) => <span className="block max-w-[18rem]"><span className="block truncate font-semibold text-olive-950">{s.name}</span><span className="block truncate text-xs text-muted-foreground">{s.shortDescription}</span></span> },
    { id: "aud", header: "Section", hideBelow: "md", sort: (s) => s.audience, cell: (s) => <span className="text-sm">{s.audience === "member" ? "Individual members" : "Businesses"}</span> },
    { id: "price", header: "Price", sort: (s) => s.price, cell: (s) => <span className="whitespace-nowrap tabular-nums">{formatPrice(s.price)} <span className="text-xs text-muted-foreground">{s.priceUnit}</span></span> },
    { id: "tiers", header: "Eligible tiers", hideBelow: "lg", cell: (s) => <span className="text-xs text-muted-foreground">{s.eligiblePlanIds.map((id) => { const p = plans.find((x) => x.id === id); return p ? `${AUDIENCE_LABEL[p.audience]} ${p.name}` : id; }).join(", ")}</span> },
    {
      id: "avail", header: "Availability", sort: (s) => s.availability,
      cell: (s) => (
        <NativeSelect aria-label={`${s.name} availability`} value={s.availability} onChange={(e) => setAvailability(s, e.target.value as ServiceAvailability)} className="h-8 w-36 text-xs">
          <option value="active">Active</option>
          <option value="coming_soon">Coming Soon</option>
          <option value="inactive">Inactive</option>
        </NativeSelect>
      ),
    },
    { id: "edit", header: "Edit", srOnlyHeader: true, cell: (s) => <Button variant="ghost" size="icon-sm" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}><Pencil /></Button> },
  ];

  return (
    <>
      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(s) => s.id}
        label="Services"
        defaultSort={{ id: "name", dir: "asc" }}
        search={{ placeholder: "Search services", text: (s) => `${s.name} ${s.shortDescription}` }}
        filters={
          <>
            <NativeSelect aria-label="Filter by section" value={audience} onChange={(e) => setAudience(e.target.value)} className="w-48">
              <option value="">All sections</option><option value="member">Individual members</option><option value="business">Businesses</option>
            </NativeSelect>
            <Button onClick={() => setEditing("new")}><Plus /> New service</Button>
          </>
        }
        noMatches={{ onClear: () => setAudience("") }}
        empty={{ title: "No services yet", description: "Create the first service." }}
      />
      <ServiceSheet target={editing} onClose={() => setEditing(null)} />
    </>
  );
}

const serviceSchema = z.object({
  audience: z.enum(["member", "business"]),
  name: z.string().trim().min(3, "Add a name").max(80),
  shortDescription: z.string().trim().min(5, "Add a short description").max(160),
  description: z.string().trim().min(10, "Add a full description").max(1500),
  price: z.number({ error: "Enter a price" }).min(0, "Can't be negative"),
  priceUnit: z.string().trim().min(2, "e.g. “one-time” or “per session”").max(30),
  included: z.string().trim().max(800),
  eligiblePlanIds: z.array(z.string()).min(1, "Choose at least one membership tier"),
  availability: z.enum(["active", "inactive", "coming_soon"]),
  image: z.string(),
});
type ServiceValues = z.infer<typeof serviceSchema>;
const emptyService: ServiceValues = { audience: "member", name: "", shortDescription: "", description: "", price: 0, priceUnit: "one-time", included: "", eligiblePlanIds: [], availability: "coming_soon", image: "" };

function ServiceSheet({ target, onClose }: { target: ServiceListing | "new" | null; onClose: () => void }) {
  const user = useSession();
  const plans = useAllPlans();
  const isNew = target === "new";
  const { register, control, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<ServiceValues>({ resolver: zodResolver(serviceSchema), defaultValues: emptyService });
  useEffect(() => {
    if (!target) return;
    reset(target === "new" ? emptyService : { ...target, included: target.included.join("\n"), image: target.image ?? "" });
  }, [target, reset]);
  const audience = useWatch({ control, name: "audience" }) as ServiceAudience;
  const tierPlans = plans.filter((p) => (audience === "member" ? p.audience !== "business" : p.audience === "business")).sort((a, b) => a.audience.localeCompare(b.audience) || a.sortOrder - b.sortOrder);

  async function onSubmit(v: ServiceValues) {
    if (!user || !target) return;
    const input = { ...v, included: v.included.split("\n").map((l) => l.trim()).filter(Boolean), image: v.image || undefined };
    try {
      if (target === "new") await marketplaceService.createService(input, user);
      else await marketplaceService.updateService(target.id, input, user);
      toast.success(isNew ? "Service created" : "Service updated");
      onClose();
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Sheet open={!!target} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-sand-200 p-5"><SheetTitle>{isNew ? "New service" : "Edit service"}</SheetTitle><SheetDescription>Shown in the member or business Services section.</SheetDescription></SheetHeader>
        <form id="service-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Section" htmlFor="sv-aud" required>
              <NativeSelect id="sv-aud" disabled={!isNew} {...register("audience", { onChange: () => setValue("eligiblePlanIds", []) })}><option value="member">Individual members</option><option value="business">Businesses</option></NativeSelect>
            </FormField>
            <FormField label="Availability" htmlFor="sv-av" required>
              <NativeSelect id="sv-av" {...register("availability")}><option value="active">Active (purchasable)</option><option value="coming_soon">Coming Soon</option><option value="inactive">Inactive (hidden)</option></NativeSelect>
            </FormField>
          </div>
          <FormField label="Service name" htmlFor="sv-name" error={errors.name?.message} required><Input id="sv-name" {...register("name")} /></FormField>
          <FormField label="Short description" htmlFor="sv-short" error={errors.shortDescription?.message} required><Input id="sv-short" {...register("shortDescription")} /></FormField>
          <FormField label="Full description" htmlFor="sv-desc" error={errors.description?.message} required><Textarea id="sv-desc" rows={4} {...register("description")} /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Price (USD)" htmlFor="sv-price" error={errors.price?.message} required><Input id="sv-price" type="number" min={0} step="0.01" {...register("price", { valueAsNumber: true })} /></FormField>
            <FormField label="Price unit" htmlFor="sv-unit" error={errors.priceUnit?.message} required><Input id="sv-unit" placeholder="per session" {...register("priceUnit")} /></FormField>
          </div>
          <FormField label="What's included" htmlFor="sv-inc" hint="One item per line."><Textarea id="sv-inc" rows={4} {...register("included")} /></FormField>
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-olive-950">Eligible membership tiers <span className="text-destructive" aria-hidden>*</span></legend>
            <Controller
              control={control}
              name="eligiblePlanIds"
              render={({ field }) => (
                <div className="grid gap-2 sm:grid-cols-2">
                  {tierPlans.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={field.value.includes(p.id)} onCheckedChange={(c) => field.onChange(c ? [...field.value, p.id] : field.value.filter((x) => x !== p.id))} />
                      {AUDIENCE_LABEL[p.audience]} · {p.name}
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.eligiblePlanIds && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.eligiblePlanIds.message}</p>}
          </fieldset>
          <Controller control={control} name="image" render={({ field }) => <ImageUpload id="sv-img" label="Image (optional)" value={field.value} onChange={field.onChange} />} />
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="service-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : "Save"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function PromotionsTable({ canApprove }: { canApprove: boolean }) {
  const user = useSession();
  const promotions = useStore(promotionStore);
  const services = useStore(serviceStore);
  const plans = useAllPlans();
  const [open, setOpen] = useState(false);
  const today = todayISO();

  async function run(fn: () => Promise<void>, ok: string) {
    try { await fn(); toast.success(ok); } catch (e) { toast.error("Couldn't update", { description: e instanceof Error ? e.message : undefined }); }
  }

  const columns: Column<ServicePromotion>[] = [
    { id: "name", header: "Promotion", sort: (p) => p.name, cell: (p) => <span className="block max-w-[16rem]"><span className="block truncate font-semibold text-olive-950">{p.name}</span><span className="block text-xs text-muted-foreground">{describePromotion(p)}{p.couponCode ? ` · code ${p.couponCode}` : " · automatic"}</span></span> },
    { id: "scope", header: "Applies to", hideBelow: "lg", cell: (p) => <span className="text-xs text-muted-foreground">{p.serviceIds.length ? p.serviceIds.map((id) => services.find((s) => s.id === id)?.name ?? id).join(", ") : "All services"} · {p.planIds.length ? p.planIds.map((id) => plans.find((x) => x.id === id)?.name ?? id).join(", ") : "All tiers"}</span> },
    { id: "period", header: "Period", hideBelow: "md", sort: (p) => p.startsOn, cell: (p) => <span className="whitespace-nowrap text-sm">{formatDate(p.startsOn)}{p.endsOn ? ` – ${formatDate(p.endsOn)}` : " →"}{p.endsOn && p.endsOn < today && <span className="ml-1 text-xs text-muted-foreground">(ended)</span>}</span> },
    {
      id: "state", header: "Status", sort: (p) => p.approval,
      cell: (p) => p.approval === "pending" ? <span className="flex flex-col items-start gap-1"><StatusPill tone="warn">Requested</StatusPill><span className="text-xs text-muted-foreground">by {p.requestedBy}</span></span>
        : p.approval === "rejected" ? <StatusPill tone="bad">Rejected</StatusPill>
        : canApprove ? <Switch checked={p.active} aria-label={`${p.name} active`} onCheckedChange={(v) => user && run(() => marketplaceService.setPromotionActive(p.id, v, user), v ? "Promotion on" : "Promotion off")} />
        : <StatusPill tone={p.active ? "good" : "neutral"}>{p.active ? "Active" : "Off"}</StatusPill>,
    },
    {
      id: "act", header: "Actions", srOnlyHeader: true,
      cell: (p) => p.approval === "pending" && canApprove && user && (
        <span className="flex justify-end gap-1">
          <Button size="sm" onClick={() => run(() => marketplaceService.reviewPromotion(p.id, true, user), "Discount approved")}><Check /> Approve</Button>
          <Button size="sm" variant="outline" onClick={() => run(() => marketplaceService.reviewPromotion(p.id, false, user), "Discount rejected")}><X /> Reject</Button>
        </span>
      ),
    },
  ];

  return (
    <>
      {!canApprove && (
        <p className="mb-4 rounded-md border border-sand-300 bg-sand-100 px-3 py-2 text-sm text-sand-700">
          You can request a discount; it applies only after someone with the “Apply service discounts” permission approves it.
        </p>
      )}
      <DataTable
        rows={promotions}
        columns={columns}
        rowKey={(p) => p.id}
        label="Service promotions"
        defaultSort={{ id: "period", dir: "desc" }}
        search={{ placeholder: "Search promotions or codes", text: (p) => `${p.name} ${p.couponCode}` }}
        filters={<Button onClick={() => setOpen(true)}><Plus /> {canApprove ? "New promotion" : "Request discount"}</Button>}
        empty={{ title: "No promotions", description: "Create a discount, coupon code or member-only price." }}
      />
      <PromotionSheet open={open} onOpenChange={setOpen} direct={canApprove} />
    </>
  );
}

const promoSchema = z
  .object({
    name: z.string().trim().min(3, "Add a name").max(80),
    kind: z.enum(["percent_off", "amount_off", "free_months", "free_consultation", "member_price"]),
    value: z.number({ error: "Enter a value" }).min(0),
    couponCode: z.string().trim().max(24).regex(/^[A-Za-z0-9-]*$/, "Letters, numbers and dashes only"),
    planIds: z.array(z.string()),
    serviceIds: z.array(z.string()),
    startsOn: z.string().min(1, "Choose a start date"),
    endsOn: z.string(),
  })
  .refine((v) => v.kind !== "percent_off" || (v.value > 0 && v.value <= 100), { path: ["value"], message: "Use 1–100%" })
  .refine((v) => !v.endsOn || v.endsOn >= v.startsOn, { path: ["endsOn"], message: "Ends before it starts" });
type PromoValues = z.infer<typeof promoSchema>;

function PromotionSheet({ open, onOpenChange, direct }: { open: boolean; onOpenChange: (o: boolean) => void; direct: boolean }) {
  const user = useSession();
  const services = useStore(serviceStore);
  const plans = useAllPlans();
  const blank: PromoValues = { name: "", kind: "percent_off", value: 10, couponCode: "", planIds: [], serviceIds: [], startsOn: todayISO(), endsOn: "" };
  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PromoValues>({ resolver: zodResolver(promoSchema), defaultValues: blank });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) reset(blank); }, [open, reset]);
  const kind = useWatch({ control, name: "kind" });

  async function onSubmit(v: PromoValues) {
    if (!user) return;
    try {
      await marketplaceService.createPromotion({ ...v, kind: v.kind as PromotionKind, endsOn: v.endsOn || undefined, active: true }, user);
      toast.success(direct ? "Promotion created" : "Discount requested", { description: direct ? undefined : "An approver will review it." });
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const checkList = (name: "planIds" | "serviceIds", options: { id: string; label: string }[]) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="grid max-h-40 gap-1.5 overflow-y-auto rounded-md border bg-white p-2 sm:grid-cols-2">
          {options.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-sm">
              <Checkbox checked={field.value.includes(o.id)} onCheckedChange={(c) => field.onChange(c ? [...field.value, o.id] : field.value.filter((x) => x !== o.id))} />
              {o.label}
            </label>
          ))}
        </div>
      )}
    />
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-sand-200 p-5"><SheetTitle>{direct ? "New promotion" : "Request a discount"}</SheetTitle><SheetDescription>Promotions don&apos;t stack — buyers get the single best one. Leave tiers or services empty to apply to all.</SheetDescription></SheetHeader>
        <form id="promo-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          <FormField label="Name" htmlFor="pr-name" error={errors.name?.message} required><Input id="pr-name" {...register("name")} /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Type" htmlFor="pr-kind" required><NativeSelect id="pr-kind" {...register("kind")}>{(Object.keys(PROMOTION_KIND_LABEL) as PromotionKind[]).map((k) => <option key={k} value={k}>{PROMOTION_KIND_LABEL[k]}</option>)}</NativeSelect></FormField>
            {kind !== "free_consultation" && (
              <FormField label={kind === "percent_off" ? "Percent" : kind === "free_months" ? "Months" : "Amount (USD)"} htmlFor="pr-val" error={errors.value?.message} required>
                <Input id="pr-val" type="number" min={0} step="0.01" {...register("value", { valueAsNumber: true })} />
              </FormField>
            )}
          </div>
          <FormField label="Coupon code" htmlFor="pr-code" error={errors.couponCode?.message} hint="Optional. Without a code the promotion applies automatically."><Input id="pr-code" className="uppercase" {...register("couponCode")} /></FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Starts" htmlFor="pr-start" error={errors.startsOn?.message} required><Input id="pr-start" type="date" {...register("startsOn")} /></FormField>
            <FormField label="Ends" htmlFor="pr-end" error={errors.endsOn?.message} hint="Optional"><Input id="pr-end" type="date" {...register("endsOn")} /></FormField>
          </div>
          <div><p className="mb-1.5 text-sm font-medium text-olive-950">Membership tiers</p>{checkList("planIds", plans.map((p) => ({ id: p.id, label: `${AUDIENCE_LABEL[p.audience]} · ${p.name}` })))}</div>
          <div><p className="mb-1.5 text-sm font-medium text-olive-950">Services</p>{checkList("serviceIds", services.map((s) => ({ id: s.id, label: s.name })))}</div>
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="promo-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : direct ? "Create promotion" : "Send request"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
