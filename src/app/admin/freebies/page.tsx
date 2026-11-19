import type { Metadata } from "next";
import { FreebiesAdmin } from "@/components/admin/freebies-admin";

export const metadata: Metadata = { title: "Freebies & Discounts" };

export default function Page() {
  return <FreebiesAdmin />;
}
