import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginFooter, LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your Mission: SITREP account." footer={<LoginFooter />}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
