import type { Metadata } from "next";
import { ServicesAdmin } from "@/components/admin/services-admin";

export const metadata: Metadata = { title: "Services Marketplace" };

export default function Page() {
  return <ServicesAdmin />;
}
