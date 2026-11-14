"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/page-header";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { DataTable, type Column } from "@/components/dashboard/data-table";
import { StatusPill } from "@/components/dashboard/status-pill";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice, plansFor } from "@/features/membership/access";
import { useAllPlans, useSubscriptions } from "@/features/membership/hooks";
import { AUDIENCE_LABEL, featuresFor } from "@/lib/mock-data/membership";
import { planSchema, type PlanFormValues } from "@/schemas/plan";
import { planService } from "@/services/membership-service";
import type { MembershipPlan, PlanAudience, PlanFeatureDef, PlanFeatureValue } from "@/types";

const AUDIENCES: PlanAudience[] = ["veteran", "civilian", "business"];

/** Admin → Membership Plans: create, rename, price, activate and configure features and limits. */
export function PlansAdmin() {
  const plans = useAllPlans();
  const subs = useSubscriptions();
  const [audience, setAudience] = useState<PlanAudience>("veteran");
  const [editing, setEditing] = useState<MembershipPlan | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deactivating, setDeactivating] = useState<MembershipPlan | null>(null);
  const [deleting, setDeleting] = useState<MembershipPlan | null>(null);
  const [cloneFrom, setCloneFrom] = useState<MembershipPlan | null>(null);

  const subscribers = (id: string) => subs.filter((s) => s.planId === id && s.status !== "canceled" && s.status !== "expired").length;
  const list = useMemo(() => plansFor(plans, audience), [plans, audience]);

  async function activate(p: MembershipPlan) {
    try {
      await planService.setActive(p.id, true);
      toast.success(`${p.name} is active and visible on the pricing page`);
    } catch (e) {
      toast.error("Couldn't activate the plan", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const columns: Column<MembershipPlan>[] = [
    {
      id: "name", header: "Plan", sort: (p) => p.sortOrder,
      cell: (p) => (
        <span className="block max-w-[16rem]">
          <span className="flex items-center gap-2"><span className="truncate font-semibold text-olive-950">{p.name}</span>{p.highlighted && <StatusPill tone="warn">Popular</StatusPill>}</span>
          <span className="block truncate text-xs text-muted-foreground">{p.tagline}</span>
        </span>
      ),
    },
    { id: "monthly", header: "Monthly", hideBelow: "sm", sort: (p) => p.monthlyPrice, cell: (p) => <span className="tabular-nums">{formatPrice(p.monthlyPrice)}</span> },
    { id: "annual", header: "Annual", hideBelow: "sm", sort: (p) => p.annualPrice, cell: (p) => <span className="tabular-nums">{formatPrice(p.annualPrice)}</span> },
    { id: "subs", header: "Subscribers", hideBelow: "md", sort: (p) => subscribers(p.id), cell: (p) => <span className="tabular-nums">{subscribers(p.id)}</span> },
    {
      id: "active", header: "Active", sort: (p) => Number(p.active),
      cell: (p) => <Switch checked={p.active} onCheckedChange={(v) => (v ? activate(p) : setDeactivating(p))} aria-label={`${p.name} active`} />,
    },
    {
      id: "actions", header: "Actions", srOnlyHeader: true,
      cell: (p) => (
        <div className="flex justify-end gap-0.5">
          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${p.name}`} onClick={() => { setEditing(p); setCloneFrom(null); setFormOpen(true); }}><Pencil /></Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Duplicate ${p.name}`} onClick={() => { setEditing(null); setCloneFrom(p); setFormOpen(true); }}><Copy /></Button>
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)}><Trash2 /></Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Membership plans"
        description="Everything on the pricing pages and comparison tables comes from these plans. Public business search and essential community resources can't be paywalled."
        actions={<Button onClick={() => { setEditing(null); setCloneFrom(null); setFormOpen(true); }}><Plus /> Create plan</Button>}
      />

      <Tabs value={audience} onValueChange={(v) => setAudience(v as PlanAudience)}>
        <TabsList className="mb-4 h-auto p-1">
          {AUDIENCES.map((a) => <TabsTrigger key={a} value={a} className="h-9 px-4">{AUDIENCE_LABEL[a]}</TabsTrigger>)}
        </TabsList>
        {AUDIENCES.map((a) => (
          <TabsContent key={a} value={a}>
            <DataTable
              rows={a === audience ? list : []}
              columns={columns}
              rowKey={(p) => p.id}
              label={`${AUDIENCE_LABEL[a]} plans`}
              defaultSort={{ id: "name", dir: "asc" }}
              pageSize={10}
              empty={{ title: "No plans yet", description: "Create the first plan for this audience.", actionLabel: "Create plan", onAction: () => setFormOpen(true) }}
            />
          </TabsContent>
        ))}
      </Tabs>

      <PlanFormSheet open={formOpen} onOpenChange={setFormOpen} plan={editing} cloneFrom={cloneFrom} defaultAudience={audience} />

      <ConfirmDialog
        open={!!deactivating}
        onOpenChange={(o) => !o && setDeactivating(null)}
        destructive
        title={`Deactivate ${deactivating?.name}?`}
        description={
          <>
            The plan disappears from the pricing pages and can&apos;t be chosen. {deactivating && subscribers(deactivating.id) > 0
              ? <><strong>{subscribers(deactivating.id)} current subscriber(s)</strong> keep it until they change or cancel.</>
              : "Nobody is subscribed to it right now."}
          </>
        }
        confirmLabel="Deactivate plan"
        busyLabel="Deactivating…"
        successMessage="Plan deactivated"
        onConfirm={async () => { if (deactivating) await planService.setActive(deactivating.id, false); }}
      />

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        destructive
        title={`Delete ${deleting?.name}?`}
        description={<>This permanently removes the plan. Plans with subscribers can&apos;t be deleted — deactivate them instead. The free plan can&apos;t be deleted.</>}
        confirmLabel="Delete plan"
        busyLabel="Deleting…"
        successMessage="Plan deleted"
        onConfirm={async () => { if (deleting) await planService.remove(deleting.id); }}
      />
    </>
  );
}

function defaultFeatures(audience: PlanAudience): Record<string, PlanFeatureValue> {
  return Object.fromEntries(featuresFor(audience).map((f) => [f.id, f.essential ? { enabled: true, limit: null } : { enabled: false, limit: f.kind === "limit" ? 0 : null }]));
}

function PlanFormSheet({ open, onOpenChange, plan, cloneFrom, defaultAudience }: { open: boolean; onOpenChange: (o: boolean) => void; plan: MembershipPlan | null; cloneFrom: MembershipPlan | null; defaultAudience: PlanAudience }) {
  const editing = !!plan;
  const blank = (audience: PlanAudience): PlanFormValues => ({ audience, name: "", tagline: "", description: "", monthlyPrice: 0, annualPrice: 0, active: true, highlighted: false, features: defaultFeatures(audience) });
  const fromPlan = (p: MembershipPlan, copy: boolean): PlanFormValues => ({ audience: p.audience, name: copy ? `${p.name} copy` : p.name, tagline: p.tagline, description: p.description, monthlyPrice: p.monthlyPrice, annualPrice: p.annualPrice, active: copy ? false : p.active, highlighted: copy ? false : p.highlighted, features: { ...defaultFeatures(p.audience), ...p.features } });

  const {
    register, control, handleSubmit, reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm<PlanFormValues>({ resolver: zodResolver(planSchema), defaultValues: blank(defaultAudience) });
  const audience = useWatch({ control, name: "audience" });
  const defs = useMemo(() => featuresFor(audience), [audience]);

  useEffect(() => {
    if (open) reset(plan ? fromPlan(plan, false) : cloneFrom ? fromPlan(cloneFrom, true) : blank(defaultAudience));
  }, [open, plan, cloneFrom, defaultAudience, reset]);

  async function onSubmit(v: PlanFormValues) {
    try {
      const features = v.features as Record<string, PlanFeatureValue>;
      if (plan) {
        const { audience: _a, ...rest } = v;
        void _a;
        await planService.update(plan.id, { ...rest, features });
      } else {
        await planService.create({ ...v, features });
      }
      toast.success(editing ? "Plan updated" : "Plan created", { description: v.name });
      onOpenChange(false);
    } catch (e) {
      toast.error("Couldn't save the plan", { description: e instanceof Error ? e.message : undefined });
    }
  }

  const toggles = defs.filter((d) => d.kind === "toggle");
  const limits = defs.filter((d) => d.kind === "limit");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 bg-sand-50 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-sand-200 p-5">
          <SheetTitle>{editing ? `Edit ${plan.name}` : cloneFrom ? `Duplicate ${cloneFrom.name}` : "Create plan"}</SheetTitle>
          <SheetDescription>Changes apply to new and existing subscribers of this plan.</SheetDescription>
        </SheetHeader>

        <form id="plan-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex-1 space-y-8 overflow-y-auto p-5">
          <fieldset className="space-y-4">
            <legend className="mb-1 font-heading text-lg font-semibold text-olive-950">Basics</legend>
            <FormField label="Audience" htmlFor="pl-aud" hint={editing ? "A plan's audience can't change after it's created." : undefined}>
              <NativeSelect
                id="pl-aud"
                disabled={editing}
                {...register("audience", { onChange: (e) => setValue("features", defaultFeatures(e.target.value as PlanAudience)) })}
              >
                {AUDIENCES.map((a) => <option key={a} value={a}>{AUDIENCE_LABEL[a]}</option>)}
              </NativeSelect>
            </FormField>
            <FormField label="Plan name" htmlFor="pl-name" error={errors.name?.message} required>
              <Input id="pl-name" aria-invalid={!!errors.name} aria-describedby={describedBy("pl-name", errors.name?.message)} {...register("name")} />
            </FormField>
            <FormField label="Tagline" htmlFor="pl-tag" error={errors.tagline?.message} required><Input id="pl-tag" {...register("tagline")} /></FormField>
            <FormField label="Description" htmlFor="pl-desc" error={errors.description?.message} required><Textarea id="pl-desc" rows={3} {...register("description")} /></FormField>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-1 font-heading text-lg font-semibold text-olive-950">Pricing</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Monthly price (USD)" htmlFor="pl-m" error={errors.monthlyPrice?.message} hint="$0 makes this a free plan." required>
                <Input id="pl-m" type="number" min={0} step="0.01" aria-invalid={!!errors.monthlyPrice} {...register("monthlyPrice", { valueAsNumber: true })} />
              </FormField>
              <FormField label="Annual price (USD)" htmlFor="pl-a" error={errors.annualPrice?.message} hint="Total billed once a year." required>
                <Input id="pl-a" type="number" min={0} step="0.01" aria-invalid={!!errors.annualPrice} {...register("annualPrice", { valueAsNumber: true })} />
              </FormField>
            </div>
            <Controller control={control} name="highlighted" render={({ field }) => <Row id="pl-hl" label="Highlight as “Most popular”" checked={field.value} onChange={field.onChange} />} />
            <Controller control={control} name="active" render={({ field }) => <Row id="pl-active" label="Active (visible on pricing pages)" checked={field.value} onChange={field.onChange} />} />
          </fieldset>

          <Controller
            control={control}
            name="features"
            render={({ field }) => {
              const value = field.value as Record<string, PlanFeatureValue>;
              const set = (id: string, v: PlanFeatureValue) => field.onChange({ ...value, [id]: v });
              return (
                <>
                  <fieldset className="space-y-2">
                    <legend className="mb-1 font-heading text-lg font-semibold text-olive-950">Feature access</legend>
                    {toggles.map((d) => <ToggleFeature key={d.id} def={d} value={value[d.id]} onChange={(v) => set(d.id, v)} />)}
                  </fieldset>
                  <fieldset className="space-y-2">
                    <legend className="mb-1 font-heading text-lg font-semibold text-olive-950">Usage limits</legend>
                    <p className="text-xs text-muted-foreground">Photos, links, promotions, featured-listing credits, saved items and appointments. Turn a feature off, set a number, or choose unlimited.</p>
                    {limits.map((d) => <LimitFeature key={d.id} def={d} value={value[d.id]} onChange={(v) => set(d.id, v)} />)}
                  </fieldset>
                </>
              );
            }}
          />
        </form>

        <SheetFooter className="flex-row justify-end gap-2 border-t border-sand-200 p-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" form="plan-form" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving…</> : editing ? "Save changes" : "Create plan"}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Row({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-white p-3 text-sm font-medium">
      {label}
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

function ToggleFeature({ def, value, onChange }: { def: PlanFeatureDef; value: PlanFeatureValue; onChange: (v: PlanFeatureValue) => void }) {
  const id = `ft-${def.id}`;
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-3 rounded-md border bg-white p-3">
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-olive-950">{def.label}{def.essential && <Lock className="size-3 text-muted-foreground" aria-label="Always included" />}</span>
        <span className="block text-xs text-muted-foreground">{def.essential ? "Always included on every plan." : def.description}</span>
      </span>
      <Switch id={id} checked={def.essential ? true : value?.enabled ?? false} disabled={def.essential} onCheckedChange={(v) => onChange({ enabled: v, limit: null })} />
    </label>
  );
}

function LimitFeature({ def, value, onChange }: { def: PlanFeatureDef; value: PlanFeatureValue; onChange: (v: PlanFeatureValue) => void }) {
  const id = `ft-${def.id}`;
  const enabled = value?.enabled ?? false;
  const unlimited = enabled && value.limit === null;
  return (
    <div className="rounded-md border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="min-w-0 cursor-pointer">
          <span className="block text-sm font-medium text-olive-950">{def.label}</span>
          <span className="block text-xs text-muted-foreground">{def.description}</span>
        </label>
        <Switch id={id} checked={enabled} onCheckedChange={(v) => onChange(v ? { enabled: true, limit: value?.limit ?? 5 } : { enabled: false, limit: 0 })} />
      </div>
      {enabled && (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Limit</span>
            <Input
              type="number"
              min={1}
              disabled={unlimited}
              aria-label={`${def.label} limit${def.unit ? ` (${def.unit})` : ""}`}
              value={unlimited ? "" : value.limit ?? ""}
              placeholder={unlimited ? "∞" : undefined}
              onChange={(e) => onChange({ enabled: true, limit: Math.max(1, Math.floor(Number(e.target.value) || 1)) })}
              className="h-9 w-24"
            />
            {def.unit && <span className="text-xs text-muted-foreground">{def.unit}</span>}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox checked={unlimited} onCheckedChange={(c) => onChange({ enabled: true, limit: c ? null : 5 })} />
            Unlimited
          </label>
        </div>
      )}
    </div>
  );
}
