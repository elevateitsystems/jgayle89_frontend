"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "./password-input";
import { UserTypeFields } from "./user-type-fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BRANCHES, registerSchema, type RegisterValues } from "@/schemas/auth";
import { authService } from "@/services/auth-service";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  return s;
}

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", userType: undefined, branch: "", password: "", confirm: "", terms: false },
  });
  const pw = useWatch({ control, name: "password" }) ?? "";
  const score = strength(pw);
  const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];

  async function onSubmit(v: RegisterValues) {
    setFormError(null);
    try {
      const user = await authService.register({
        name: v.name,
        email: v.email,
        userType: v.userType,
        branch: v.userType === "veteran" ? (v.branch as (typeof BRANCHES)[number]) : undefined,
      });
      toast.success(`Welcome to the community, ${user.name.split(" ")[0]}!`, { description: "Your demo account is ready." });
      router.push("/directory");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setFormError(message);
      toast.error("Registration failed", { description: message });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          {formError}
        </p>
      )}
      <FormField label="Full name" htmlFor="name" error={errors.name?.message} required>
        <Input id="name" autoComplete="name" placeholder="Alex Morgan" aria-invalid={!!errors.name} aria-describedby={describedBy("name", errors.name?.message)} {...register("name")} />
      </FormField>

      <FormField label="Email" htmlFor="reg-email" error={errors.email?.message} required>
        <Input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} aria-describedby={describedBy("reg-email", errors.email?.message)} {...register("email")} />
      </FormField>

      <UserTypeFields control={control} register={register} errors={errors} idPrefix="reg" />

      <FormField label="Password" htmlFor="reg-password" error={errors.password?.message} hint="8+ characters, one uppercase letter and one number." required>
        <PasswordInput id="reg-password" autoComplete="new-password" aria-invalid={!!errors.password} aria-describedby={describedBy("reg-password", errors.password?.message, "hint")} {...register("password")} />
        {pw && (
          <div className="pt-1.5" aria-live="polite">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={cn("h-1 flex-1 rounded-full bg-sand-200 transition-colors", score >= i && (score <= 1 ? "bg-destructive" : score === 2 ? "bg-brass" : "bg-olive-600"))} />
              ))}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Strength: {labels[score]}</p>
          </div>
        )}
      </FormField>

      <FormField label="Confirm password" htmlFor="confirm" error={errors.confirm?.message} required>
        <PasswordInput id="confirm" autoComplete="new-password" aria-invalid={!!errors.confirm} aria-describedby={describedBy("confirm", errors.confirm?.message)} {...register("confirm")} />
      </FormField>

      <div>
        <Controller
          control={control}
          name="terms"
          render={({ field }) => (
            <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
              <Checkbox className="mt-0.5" checked={field.value} onCheckedChange={(v) => field.onChange(!!v)} aria-invalid={!!errors.terms} />
              <span>I understand this is a demo and no real account is created.</span>
            </label>
          )}
        />
        {errors.terms && <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">{errors.terms.message}</p>}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" /> Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Tip: an email starting with <code className="font-semibold">taken@</code> shows the error state.</p>
    </form>
  );
}

export function RegisterFooter() {
  return (
    <>
      Already have an account?{" "}
      <Link href="/login" className="font-semibold text-olive-700 underline-offset-2 hover:underline">
        Sign in
      </Link>
    </>
  );
}
