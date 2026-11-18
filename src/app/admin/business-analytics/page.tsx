import type { Metadata } from "next";
import { BusinessAnalyticsAdmin } from "@/components/admin/business-analytics-admin";

export const metadata: Metadata = { title: "Business Analytics" };

export default function Page() {
  return <BusinessAnalyticsAdmin />;
}
