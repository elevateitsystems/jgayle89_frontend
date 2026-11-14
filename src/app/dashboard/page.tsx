import type { Metadata } from "next";
import { DashboardHome } from "@/components/dashboard/member-pages";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return <DashboardHome />;
}
