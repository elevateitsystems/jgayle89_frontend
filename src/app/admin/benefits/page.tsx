import type { Metadata } from "next";
import { BenefitsAdmin } from "@/components/admin/benefits-admin";

export const metadata: Metadata = { title: "Benefits" };

export default function Page() {
  return <BenefitsAdmin />;
}
