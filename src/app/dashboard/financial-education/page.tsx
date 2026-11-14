import type { Metadata } from "next";
import { FinancialEducationPage } from "@/components/dashboard/member-pages";

export const metadata: Metadata = { title: "Financial Education" };

export default function Page() {
  return <FinancialEducationPage />;
}
