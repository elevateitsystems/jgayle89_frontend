import type { Metadata } from "next";
import { ReportsAdmin } from "@/components/membership/reports-admin";

export const metadata: Metadata = { title: "Reports & Analytics" };

export default function Page() {
  return <ReportsAdmin />;
}
