import type { Metadata } from "next";
import { AnalyticsPage } from "@/components/business/owner-pages";

export const metadata: Metadata = { title: "Business Analytics" };

export default function Page() {
  return <AnalyticsPage />;
}
