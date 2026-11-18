"use client";

import { Controller, useWatch, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { Medal, Siren, UserRound } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { US_STATES } from "@/data/us-states";
import {
  FIRST_RESPONDER_CATEGORIES, FIRST_RESPONDER_LABEL, SERVICE_STATUSES, SERVICE_STATUS_LABEL, isCurrentlyServing, type ProfileFormValues,
} from "@/features/profile/profile";
import { cn } from "@/lib/utils";
import { MEMBER_BRANCHES } from "@/types";

type Shape = Omit<ProfileFormValues, "name">;

const options = [
  { value: "veteran", label: "Veteran / Military", hint: "Currently serving or served", icon: Medal },
  { value: "civilian", label: "Civilian", hint: "Supporting the community", icon: UserRound },
] as const;

const legend = "mb-2 text-sm font-semibold text-olive-950";

/**
 * Member profile fields shared by registration and profile settings (client update §1):
 * account type, military service details (veterans), residence and the "I am a First Responder" option.
 */
export function UserTypeFields<T extends Shape>({
  control,
  register,
  errors,
  idPrefix,
}: {
  control: Control<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<Shape>;
  idPrefix: string;
}) {
  // The generic form is narrowed to the fields this component owns.
  const c = control as unknown as Control<Shape>;
  const r = register as unknown as UseFormRegister<Shape>;
  const userType = useWatch({ control: c, name: "userType" });
  const status = useWatch({ control: c, name: "serviceStatus" });
  const firstResponder = useWatch({ control: c, name: "firstResponder" });
  const frCategory = useWatch({ control: c, name: "frCategory" });
  const id = (k: string) => `${idPrefix}-${k}`;
  const field = (k: keyof Shape) => ({ "aria-invalid": !!errors[k], "aria-describedby": describedBy(id(k), errors[k]?.message as string | undefined) });
  const veteran = userType === "veteran";

  const check = (name: "disabledVeteran" | "combatVeteran" | "purpleHeart" | "datesApproximate" | "firstResponder", label: string) => (
    <Controller
      control={c}
      name={name}
      render={({ field: f }) => (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm">
          <Checkbox checked={!!f.value} onCheckedChange={(v) => f.onChange(!!v)} />
          {label}
        </label>
      )}
    />
  );

  return (
    <>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-olive-950">
          I am a <span className="text-destructive" aria-hidden>*</span>
        </legend>
        <Controller
          control={c}
          name="userType"
          render={({ field: f }) => (
            <div role="radiogroup" aria-label="Account type" className="grid gap-2 sm:grid-cols-2">
              {options.map((o) => {
                const selected = f.value === o.value;
                return (
                  <label
                    key={o.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border bg-white px-3 py-2.5 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                      selected ? "border-olive-600 bg-olive-50 ring-1 ring-olive-600" : "border-input hover:bg-sand-100",
                    )}
                  >
                    <input type="radio" name={id("userType")} value={o.value} checked={selected} onChange={() => f.onChange(o.value)} className="sr-only" />
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-olive-100 text-olive-700">
                      <o.icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-olive-950">{o.label}</span>
                      <span className="block text-xs text-muted-foreground">{o.hint}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        />
        {errors.userType && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.userType.message}</p>}
      </fieldset>

      {veteran && (
        <fieldset className="space-y-4 rounded-md border border-sand-300 bg-sand-50 p-4">
          <legend className={cn(legend, "px-1")}>Military service</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Branch" htmlFor={id("branch")} error={errors.branch?.message} required>
              <NativeSelect id={id("branch")} {...field("branch")} {...r("branch")}>
                <option value="">Select…</option>
                {MEMBER_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </NativeSelect>
            </FormField>
            <FormField label="Service status" htmlFor={id("serviceStatus")} error={errors.serviceStatus?.message} required>
              <NativeSelect id={id("serviceStatus")} {...field("serviceStatus")} {...r("serviceStatus")}>
                <option value="">Select…</option>
                {SERVICE_STATUSES.map((s) => <option key={s} value={s}>{SERVICE_STATUS_LABEL[s]}</option>)}
              </NativeSelect>
            </FormField>
            <FormField label="Service start (month / year)" htmlFor={id("serviceStart")} error={errors.serviceStart?.message} required>
              <Input id={id("serviceStart")} type="month" placeholder="YYYY-MM" {...field("serviceStart")} {...r("serviceStart")} />
            </FormField>
            <FormField
              label="Service end (month / year)"
              htmlFor={id("serviceEnd")}
              error={errors.serviceEnd?.message}
              hint={isCurrentlyServing(status) ? "Leave blank while you're still serving." : "If applicable."}
            >
              <Input id={id("serviceEnd")} type="month" placeholder="YYYY-MM" {...field("serviceEnd")} {...r("serviceEnd")} />
            </FormField>
          </div>
          {check("datesApproximate", "These dates are my best estimate")}
          <div>
            <p className="mb-2 text-sm font-medium text-olive-950">Service recognition <span className="font-normal text-muted-foreground">(optional)</span></p>
            <div className="grid gap-2 sm:grid-cols-3">
              {check("disabledVeteran", "Disabled veteran")}
              {check("combatVeteran", "Combat veteran")}
              {check("purpleHeart", "Purple Heart recipient")}
            </div>
          </div>
        </fieldset>
      )}

      <fieldset className="space-y-4">
        <legend className={legend}>
          Where you live {!veteran && <span className="font-normal text-muted-foreground">(optional — used for benefits and Near Me)</span>}
        </legend>
        <div className="grid gap-4 sm:grid-cols-[1fr_150px_120px]">
          <FormField label="City" htmlFor={id("city")} error={errors.city?.message} required={veteran}>
            <Input id={id("city")} autoComplete="address-level2" {...field("city")} {...r("city")} />
          </FormField>
          <FormField label="State" htmlFor={id("state")} error={errors.state?.message} required={veteran}>
            <NativeSelect id={id("state")} autoComplete="address-level1" {...field("state")} {...r("state")}>
              <option value="">Select…</option>
              {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </NativeSelect>
          </FormField>
          <FormField label="ZIP code" htmlFor={id("zip")} error={errors.zip?.message} required={veteran}>
            <Input id={id("zip")} inputMode="numeric" autoComplete="postal-code" maxLength={10} {...field("zip")} {...r("zip")} />
          </FormField>
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-md border border-sand-300 bg-white p-4">
        <legend className="sr-only">First responder</legend>
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive"><Siren className="size-4" aria-hidden /></span>
          <div className="min-w-0 flex-1 space-y-1">
            {check("firstResponder", "I am a First Responder")}
            <p className="text-xs text-muted-foreground">Adds a First Responder badge to your profile. It doesn&apos;t change your membership plan.</p>
          </div>
        </div>
        {firstResponder && (
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="First responder category" htmlFor={id("frCategory")} error={errors.frCategory?.message} required>
              <NativeSelect id={id("frCategory")} {...field("frCategory")} {...r("frCategory")}>
                <option value="">Select…</option>
                {FIRST_RESPONDER_CATEGORIES.map((k) => <option key={k} value={k}>{FIRST_RESPONDER_LABEL[k]}</option>)}
              </NativeSelect>
            </FormField>
            {frCategory === "other" && (
              <FormField label="Your role" htmlFor={id("frOther")} error={errors.frOther?.message} required>
                <Input id={id("frOther")} placeholder="e.g. Search & Rescue" {...field("frOther")} {...r("frOther")} />
              </FormField>
            )}
          </div>
        )}
      </fieldset>
    </>
  );
}
