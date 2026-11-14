import type { Metadata } from "next";
import { PaymentsAdmin } from "@/components/membership/payments-admin";

export const metadata: Metadata = { title: "Payments & Transactions" };

export default function Page() {
  return <PaymentsAdmin />;
}
