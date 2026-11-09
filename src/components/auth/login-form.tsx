"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ForgotPasswordDialog } from "./forgot-password-dialog";
import { PasswordInput } from "./password-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, describedBy } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { demoAccounts, DEMO_PASSWORD_HINT } from "@/data/users";
import { homePathFor, safeNextPath } from "@/lib/permissions";
import { loginSchema, type LoginValues } from "@/schemas/auth";
import { authService } from "@/services/auth-service";

export function LoginForm() {
  const router = useRouter();
  const next = safeNextPath(useSearchParams().get("next"));
  const [formError, setFormError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", remember: true },
  });

  async function onSubmit(values: LoginValues) {
    setFormError(null);
    try {
      const user = await authService.login(values.email, values.password);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`, { description: `Signed in as ${user.role === "user" ? "a member" : user.role}.` });
      // Members can't use admin links, so only follow `next` when it's actually reachable for them.
      const target = next && (user.role !== "user" || !next.startsWith("/admin")) ? next : homePathFor(user);
      router.push(target);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Something went wrong.";
      setFormError(message);
      toast.error("Sign in failed", { description: message });
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        {formError && (
          <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            {formError}
          </p>
        )}
        <FormField label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            aria-describedby={describedBy("email", errors.email?.message)}
            {...register("email")}
          />
        </FormField>

        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          labelAction={
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-xs font-semibold text-olive-700 underline-offset-2 hover:underline"
            >
              Forgot password?
            </button>
          }
        >
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            aria-invalid={!!errors.password}
            aria-describedby={describedBy("password", errors.password?.message)}
            {...register("password")}
          />
        </FormField>

        <Controller
          control={control}
          name="remember"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(!!v)} />
              Remember me on this device
            </label>
          )}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <div className="rounded-md bg-sand-100 px-3 py-3 text-xs leading-relaxed text-sand-700">
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Demo only. Pick an account to try each access level — the password isn&apos;t checked (8+ characters required).
              Try <code className="font-semibold">fail@demo.com</code> to preview the error state.
            </span>
          </p>
          <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2" aria-label="Demo accounts">
            {demoAccounts.map((a) => (
              <li key={a.email}>
                <button
                  type="button"
                  onClick={() => {
                    setValue("email", a.email, { shouldValidate: true });
                    setValue("password", DEMO_PASSWORD_HINT, { shouldValidate: true });
                  }}
                  className="w-full rounded-md border border-sand-300 bg-white px-2.5 py-2 text-left transition-colors hover:border-olive-400 hover:bg-olive-50"
                >
                  <span className="block text-sm font-semibold text-olive-950">{a.label}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{a.email}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </form>
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </>
  );
}

export function LoginFooter() {
  return (
    <>
      New to Mission: SITREP?{" "}
      <Link href="/register" className="font-semibold text-olive-700 underline-offset-2 hover:underline">
        Create an account
      </Link>
    </>
  );
}
