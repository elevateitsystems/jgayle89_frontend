import type { Metadata } from "next";
import { BusinessesTable } from "@/components/admin/businesses-table";

export const metadata: Metadata = { title: "Businesses" };

export default function AdminBusinessesPage() {
  return <BusinessesTable />;
}
