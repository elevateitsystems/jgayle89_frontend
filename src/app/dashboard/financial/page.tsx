import type { Metadata } from "next";
import { FinancialToolsPage } from "@/components/dashboard/member-pages";

export const metadata: Metadata = { title: "Financial Tools" };

export default function Page() {
  return <FinancialToolsPage />;
}
