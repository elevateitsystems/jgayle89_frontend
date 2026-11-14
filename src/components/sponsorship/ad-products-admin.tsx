"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Gift, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAdProducts, useCampaigns, useCredits } from "@/features/advertising/hooks";
import { slotsUsedDuring } from "@/features/advertising/rules";
import { formatPrice, plansFor } from "@/features/membership/access";
import { useAllPlans } from "@/features/membership/hooks";
import { useBusinesses } from "@/hooks/use-businesses";
import { useSession } from "@/hooks/use-session";
import { daysFromToday, formatDate } from "@/lib/date";
import { adProductSchema, creditSchema, type AdProductFormValues, type CreditFormValues } from "@/schemas/campaign";
import { adService } from "@/services/ad-service";
import { planService } from "@/services/membership-service";
import type { AdProduct, PromoCredit } from "@/types";

/** Admin → Sponsorship Products: products & pricing, inventory, promotional credits and per-plan included placements. */
export function AdProductsAdmin() {
  return (
    <>
      <PageHeader title="Sponsorship products" description="Create and price advertising and sponsorship products, control inventory, grant promotional credits and decide what each membership plan includes." />
      <Tabs defaultValue="products">
        <TabsList className="mb-4 h-auto flex-wrap justify-start gap-1 p-1">
          <TabsTrigger value="products" className="h-9 px-4">Products &amp; inventory</TabsTrigger>
          <TabsTrigger value="credits" className="h-9 px-4">Promotional credits</TabsTrigger>
          <TabsTrigger value="plans" className="h-9 px-4">Plan benefits</TabsTrigger>
        </TabsList>
        <TabsContent value="products"><Products /></TabsContent>
        <TabsContent value="credits"><Credits /></TabsContent>
        <TabsContent value="plans"><PlanBenefits /></TabsContent>
      </Tabs>
    </>
  );
}

function Products() {
  const user = useSession();
  const products = useAdProducts();
  const campaigns = useCampaigns();
  const [editing, setEditing] = useState<AdProduct | null>(null);
  const [open, setOpen] = useState(false);
  const [deactivate, setDeactivate] = useState<AdProduct | null>(null);
  const today = daysFromToday(0);

  async function setActive(p: AdProduct, active: boolean) {
    if (!user) return;
    await adService.updateProduct(p.id, { active }, user);
    toast.success(active ? `${p.name} is available again` : `${p.name} was deactivated`);
  }

  const columns: Column<AdProduct>[] = [
    { id: "name", header: "Product", sort: (p) => p.name, cell: (p) => <span className="block max-w-[16rem]"><span className="block truncate font-semibold text-olive-950">{p.name}</span><span className="block truncate text-xs text-muted-foreground">{p.placement}</span></span> },
    { id: "family", header: "Type", hideBelow: "md", sort: (p) => p.family, cell: (p) => <span className="capitalize">{p.family}</span> },
    { id: "price", header: "Pricing", hideBelow: "sm", cell: (p) => <span className="whitespace-nowrap tabular-nums">{p.durations.map((d) => `${d.days}d ${formatPrice(d.price)}`).join(" · ")}</span> },
    {
      id: "slots", header: "Slots in use", hideBelow: "lg", sort: (p) => p.totalSlots,
      cell: (p) => { const used = slotsUsedDuring(p, campaigns, today, daysFromToday(30)); return <span className="tabular-nums">{used} / {p.totalSlots}</span>; },
    },
    { id: "active", header: "Active", sort: (p) => Number(p.active), cell: (p) => <Switch checked={p.active} onCheckedChange={(v) => (v ? setActive(p, true).catch(() => toast.error("Couldn't update")) : setDeactivate(p))} aria-label={`${p.name} active`} /> },
    { id: "edit", header: "Edit", srOnlyHeader: true, cell: (p) => <Button variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`} onClick={() => { setEditing(p); setOpen(true); }}><Pencil /></Button> },
  ];

  return (
    <>
      <DataTable
        rows={products}
        columns={columns}
        rowKey={(p) => p.id}
        label="Advertising products"
        defaultSort={{ id: "name", dir: "asc" }}
        search={{ placeholder: "Search products", text: (p) => `${p.name} ${p.description} ${p.family}` }}
        filters={<Button onClick={() => { setEditing(null); setOpen(true); }}><Plus /> New product</Button>}
        empty={{ title: "No products", description: "Create the first advertising product.", actionLabel: "New product", onAction: () => setOpen(true) }}
      />
      <ProductSheet open={open} onOpenChange={setOpen} product={editing} />
      <ConfirmDialog
        open={!!deactivate}
        onOpenChange={(o) => !o && setDeactivate(null)}
        destructive
        title="Deactivate this product?"
        description={<><strong>{deactivate?.name}</strong> disappears from the marketplace, so no new campaigns can be created. Campaigns already approved or running are not affected.</>}
        confirmLabel="Deactivate"
        busyLabel="Deactivating…"
        onConfirm={async () => { if (deactivate) await setActive(deactivate, false); }}
      />
    </>
  );
}

function ProductSheet({ open, onOpenChange, product }: { open: boolean; onOpenChange: (o: boolean) => void; product: AdProduct | null }) {
  const user = useSession();
  const editing = !!product;
  const blank: AdProductFormValues = { name: "", description: "", placement: "", label: "Sponsored", family: "advertising", targeting: "none", totalSlots: 3, active: true, needsImage: false, needsLogo: false, imageSpec: "", durations: [{ days: 7, price: 50 }] };
  const {
    register, control, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<AdProductFormValues>({ resolver: zodResolver(adProductSchema), defaultValues: blank });
  const durations = useFieldArray({ control, name: "durations" });
  useEffect(() => {
    if (open) reset(product ? { name: product.name, description: product.description, placement: product.placement, label: product.label, family: product.family, targeting: product.targeting, totalSlots: product.totalSlots, active: product.active, needsImage: product.needsImage, needsLogo: product.needsLogo, imageSpec: product.imageSpec, durations: product.durations } : blank);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, reset]);

  async function onSubmit(v: AdProductFormValues) {
    if (!user) return;
    try {
      const data = { ...v, kind: product?.kind ?? "featured_search", durations: [...v.durations].sort((a, b) => a.days - b.days) } as Omit<AdProduct, "id">;
      if (product) await adService.updateProduct(product.id, data, user);
      else await adService.createProduct(data, user);
      toast.success(editing ? "Product updated" : "Product created");
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't save the product", { description: e instanceof Error ? e.message : undefined });
    }
  }
  const err = errors as Record<string, { message?: string } | undefined>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-sand-200 p-5"><SheetTitle>{editing ? "Edit product" : "New product"}</SheetTitle><SheetDescription>Prices and slots apply to new campaigns only.</SheetDescription></SheetHeader>
        <form id="product-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-5 overflow-y-auto p-5">
          <FormField label="Name" htmlFor="ap-name" error={err.name?.message} required><Input id="ap-name" aria-invalid={!!err.name} aria-describedby={describedBy("ap-name", err.name?.message)} {...register("name")} /></FormField>
          <FormField label="Description" htmlFor="ap-desc" error={err.description?.message} required><Textarea id="ap-desc" rows={2} {...register("description")} /></FormField>
          <FormField label="Where it appears" htmlFor="ap-place" error={err.placement?.message} required><Input id="ap-place" {...register("placement")} /></FormField>
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField label="Type" htmlFor="ap-family"><NativeSelect id="ap-family" {...register("family")}><option value="advertising">Advertising</option><option value="sponsorship">Sponsorship</option></NativeSelect></FormField>
            <FormField label="Public label" htmlFor="ap-label"><NativeSelect id="ap-label" {...register("label")}><option>Sponsored</option><option>Advertisement</option></NativeSelect></FormField>
            <FormField label="Targeting" htmlFor="ap-target"><NativeSelect id="ap-target" {...register("targeting")}><option value="none">None</option><option value="category">Categories</option><option value="geo">States / city</option><option value="event">Event</option><option value="resource">Resource</option></NativeSelect></FormField>
          </div>
          <FormField label="Available slots" htmlFor="ap-slots" error={err.totalSlots?.message} hint="How many campaigns can run at the same time." required><Input id="ap-slots" type="number" min={0} className="w-32" {...register("totalSlots", { valueAsNumber: true })} /></FormField>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-olive-950">Durations &amp; pricing <span className="text-destructive" aria-hidden>*</span></legend>
            {durations.fields.map((f, i) => {
              const e = (errors.durations?.[i] ?? {}) as Record<string, { message?: string }>;
              return (
                <div key={f.id} className="grid grid-cols-[1fr_1fr_auto] items-start gap-3">
                  <FormField label="Days" htmlFor={`d-${i}`} error={e.days?.message}><Input id={`d-${i}`} type="number" min={1} {...register(`durations.${i}.days` as const, { valueAsNumber: true })} /></FormField>
                  <FormField label="Price (USD)" htmlFor={`p-${i}`} error={e.price?.message}><Input id={`p-${i}`} type="number" min={0} step="1" {...register(`durations.${i}.price` as const, { valueAsNumber: true })} /></FormField>
                  <Button type="button" variant="ghost" size="icon-sm" className="mt-6" aria-label={`Remove duration ${i + 1}`} disabled={durations.fields.length === 1} onClick={() => durations.remove(i)}><Trash2 /></Button>
                </div>
              );
            })}
            {errors.durations?.root?.message || (errors.durations as { message?: string } | undefined)?.message ? <p role="alert" className="text-xs font-medium text-destructive">{(errors.durations as { message?: string }).message ?? errors.durations?.root?.message}</p> : null}
            <Button type="button" variant="outline" size="sm" onClick={() => durations.append({ days: 30, price: 100 })}><Plus /> Add duration</Button>
          </fieldset>

          <Controller control={control} name="needsImage" render={({ field }) => <Toggle id="ap-img" label="Requires a promotional image" checked={field.value} onChange={field.onChange} />} />
          <Controller control={control} name="needsLogo" render={({ field }) => <Toggle id="ap-logo" label="Requires a logo" checked={field.value} onChange={field.onChange} />} />
          <FormField label="Creative requirements" htmlFor="ap-spec" hint="Shown to advertisers next to the upload."><Input id="ap-spec" {...register("imageSpec")} /></FormField>
          <Controller control={control} name="active" render={({ field }) => <Toggle id="ap-active" label="Active (available in the marketplace)" checked={field.value} onChange={field.onChange} />} />
        </form>
        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="product-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : editing ? "Save changes" : "Create product"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-white p-3 text-sm font-medium">
      {label}
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function Credits() {
  const user = useSession();
  const credits = useCredits();
  const [granting, setGranting] = useState(false);
  const [revoking, setRevoking] = useState<PromoCredit | null>(null);
  const today = daysFromToday(0);

  const columns: Column<PromoCredit>[] = [
    { id: "biz", header: "Business", sort: (c) => c.businessName, cell: (c) => <span className="block max-w-[14rem] truncate font-semibold text-olive-950">{c.businessName}</span> },
    { id: "reason", header: "Reason", hideBelow: "md", cell: (c) => c.reason },
    { id: "amount", header: "Remaining", sort: (c) => c.remaining, cell: (c) => <span className="tabular-nums">{formatPrice(c.remaining)} <span className="text-xs text-muted-foreground">of {formatPrice(c.amount)}</span></span> },
    { id: "exp", header: "Expires", hideBelow: "sm", sort: (c) => c.expiresOn, cell: (c) => (c.expiresOn < today ? <StatusPill tone="neutral">Expired</StatusPill> : <span className="whitespace-nowrap text-muted-foreground">{formatDate(c.expiresOn)}</span>) },
    { id: "act", header: "Revoke", srOnlyHeader: true, cell: (c) => <Button variant="ghost" size="icon-sm" aria-label={`Revoke credit for ${c.businessName}`} onClick={() => setRevoking(c)}><Trash2 /></Button> },
  ];

  return (
    <>
      <DataTable
        rows={credits}
        columns={columns}
        rowKey={(c) => c.id}
        label="Promotional credits"
        defaultSort={{ id: "exp", dir: "asc" }}
        search={{ placeholder: "Search credits", text: (c) => `${c.businessName} ${c.reason}` }}
        filters={<Button onClick={() => setGranting(true)}><Gift /> Grant credit</Button>}
        empty={{ title: "No promotional credits", description: "Grant a credit to help a business try advertising.", actionLabel: "Grant credit", onAction: () => setGranting(true) }}
      />
      <CreditDialog open={granting} onOpenChange={setGranting} />
      <ConfirmDialog
        open={!!revoking}
        onOpenChange={(o) => !o && setRevoking(null)}
        destructive
        title="Revoke this credit?"
        description={<>The remaining {revoking ? formatPrice(revoking.remaining) : ""} for <strong>{revoking?.businessName}</strong> will be removed.</>}
        confirmLabel="Revoke credit"
        busyLabel="Revoking…"
        successMessage="Credit revoked"
        onConfirm={async () => { if (revoking && user) await adService.revokeCredit(revoking.id, user); }}
      />
    </>
  );
}

function CreditDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const user = useSession();
  const { businesses } = useBusinesses();
  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm<CreditFormValues>({ resolver: zodResolver(creditSchema), defaultValues: { businessId: "", amount: 50, reason: "", expiresOn: daysFromToday(90) } });
  useEffect(() => {
    if (open) reset({ businessId: "", amount: 50, reason: "", expiresOn: daysFromToday(90) });
  }, [open, reset]);

  async function onSubmit(v: CreditFormValues) {
    if (!user) return;
    try {
      await adService.grantCredit({ businessId: v.businessId, amount: Number(v.amount), reason: v.reason, expiresOn: v.expiresOn }, user);
      toast.success("Credit granted");
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't grant the credit", { description: e instanceof Error ? e.message : undefined });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Grant promotional credit</DialogTitle><DialogDescription>Credit reduces what the business pays for advertising at checkout. It never applies to membership.</DialogDescription></DialogHeader>
        <form id="credit-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <FormField label="Business" htmlFor="cr-biz" error={errors.businessId?.message} required>
            <NativeSelect id="cr-biz" aria-invalid={!!errors.businessId} {...register("businessId")}>
              <option value="">Select a business…</option>
              {businesses.filter((b) => b.ownerId).sort((a, b) => a.name.localeCompare(b.name)).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </NativeSelect>
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Amount (USD)" htmlFor="cr-amt" error={errors.amount?.message} required><Input id="cr-amt" type="number" min={1} step="1" {...register("amount", { valueAsNumber: true })} /></FormField>
            <FormField label="Expires on" htmlFor="cr-exp" error={errors.expiresOn?.message} required><Input id="cr-exp" type="date" min={daysFromToday(1)} {...register("expiresOn")} /></FormField>
          </div>
          <FormField label="Reason" htmlFor="cr-reason" error={errors.reason?.message} required><Input id="cr-reason" {...register("reason")} /></FormField>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="credit-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Granting…</> : "Grant credit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Included advertising benefits per business plan (placements per month). */
function PlanBenefits() {
  const user = useSession();
  const plans = useAllPlans();
  const products = useAdProducts();
  const bizPlans = useMemo(() => plansFor(plans, "business"), [plans]);
  const [draft, setDraft] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState(false);

  const value = (planId: string, productId: string) => draft[planId]?.[productId] ?? bizPlans.find((p) => p.id === planId)?.adAllowances[productId] ?? 0;
  const dirty = Object.keys(draft).length > 0;

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      for (const [planId, changes] of Object.entries(draft)) {
        const plan = bizPlans.find((p) => p.id === planId);
        if (!plan) continue;
        const merged = { ...plan.adAllowances, ...changes };
        for (const k of Object.keys(merged)) if (!merged[k]) delete merged[k];
        await planService.update(planId, { adAllowances: merged });
      }
      setDraft({});
      toast.success("Plan benefits saved");
    } catch (e) {
      toast.error("Couldn't save", { description: e instanceof Error ? e.message : undefined });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Placements included with each business plan, per month. These are shown to owners in the marketplace and on the plan comparison. Redeeming them happens at checkout once billing is connected.</p>
      <div className="overflow-x-auto rounded-lg border bg-card shadow-card">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Included advertising placements per month, by business plan</caption>
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50">
              <th scope="col" className="sticky left-0 min-w-52 bg-sand-50 px-4 py-3 text-left font-semibold">Product</th>
              {bizPlans.map((p) => <th key={p.id} scope="col" className="px-4 py-3 text-center font-semibold">{p.name}{!p.active && <span className="block text-[10px] font-normal text-muted-foreground">inactive</span>}</th>)}
            </tr>
          </thead>
          <tbody>
            {products.map((prod) => (
              <tr key={prod.id} className="border-b border-sand-200 last:border-0">
                <th scope="row" className="sticky left-0 bg-card px-4 py-2.5 text-left font-medium">{prod.name}{!prod.active && <span className="ml-2 text-xs font-normal text-muted-foreground">(inactive)</span>}</th>
                {bizPlans.map((p) => (
                  <td key={p.id} className="px-4 py-2 text-center">
                    <Input
                      type="number"
                      min={0}
                      max={20}
                      aria-label={`${prod.name} included per month on ${p.name}`}
                      value={value(p.id, prod.id)}
                      onChange={(e) => {
                        const n = Math.max(0, Math.min(20, Math.floor(Number(e.target.value) || 0)));
                        setDraft((d) => ({ ...d, [p.id]: { ...d[p.id], [prod.id]: n } }));
                      }}
                      className="mx-auto h-9 w-20 text-center"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={!dirty || saving}>{saving ? <><Loader2 className="animate-spin" /> Saving…</> : "Save plan benefits"}</Button>
        <Button variant="outline" onClick={() => setDraft({})} disabled={!dirty || saving}>Discard changes</Button>
      </div>
    </div>
  );
}
