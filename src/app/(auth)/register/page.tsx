import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterFooter, RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create an account" };

export default function RegisterPage() {
  return (
    <AuthShell title="Join the community" subtitle="Create a free account to list your business and RSVP to events." footer={<RegisterFooter />}>
      <RegisterForm />
    </AuthShell>
  );
}
