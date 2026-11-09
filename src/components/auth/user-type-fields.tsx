"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { Medal, UserRound } from "lucide-react";
import { FormField, describedBy } from "@/components/ui/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { BRANCHES } from "@/schemas/auth";
import { cn } from "@/lib/utils";

interface Shape {
  userType: "veteran" | "civilian";
  branch: string;
}

const options = [
  { value: "veteran", label: "Veteran / Military", hint: "Currently serving or served", icon: Medal },
  { value: "civilian", label: "Civilian", hint: "Supporting the community", icon: UserRound },
] as const;

/** "I am a…" selector + branch (veterans only). Shared by registration and the profile page. */
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
  // The generic form is narrowed to the two fields this component owns.
  const c = control as unknown as Control<Shape>;
  const r = register as unknown as UseFormRegister<Shape>;
  const userType = useWatch({ control: c, name: "userType" });

  return (
    <>
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-olive-950">
          I am a <span className="text-destructive" aria-hidden>*</span>
        </legend>
        <Controller
          control={c}
          name="userType"
          render={({ field }) => (
            <div role="radiogroup" aria-label="Account type" className="grid gap-2 sm:grid-cols-2">
              {options.map((o) => {
                const selected = field.value === o.value;
                return (
                  <label
                    key={o.value}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md border bg-white px-3 py-2.5 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50",
                      selected ? "border-olive-600 bg-olive-50 ring-1 ring-olive-600" : "border-input hover:bg-sand-100",
                    )}
                  >
                    <input
                      type="radio"
                      name={`${idPrefix}-userType`}
                      value={o.value}
                      checked={selected}
                      onChange={() => field.onChange(o.value)}
                      className="sr-only"
                    />
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

      {userType === "veteran" && (
        <FormField label="Branch of service" htmlFor={`${idPrefix}-branch`} error={errors.branch?.message} required>
          <NativeSelect
            id={`${idPrefix}-branch`}
            aria-invalid={!!errors.branch}
            aria-describedby={describedBy(`${idPrefix}-branch`, errors.branch?.message)}
            {...r("branch")}
          >
            <option value="">Select…</option>
            {BRANCHES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      )}
    </>
  );
}
