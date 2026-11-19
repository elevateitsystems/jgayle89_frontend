import type { Metadata } from "next";
import { ServiceOrdersAdmin } from "@/components/admin/service-orders-admin";

export const metadata: Metadata = { title: "Service Orders" };

export default function Page() {
  return <ServiceOrdersAdmin />;
}
