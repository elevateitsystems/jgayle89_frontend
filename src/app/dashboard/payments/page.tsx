import type { Metadata } from "next";
import { PaymentHistoryPage } from "@/components/business/owner-pages";

export const metadata: Metadata = { title: "Payment History" };

export default function Page() {
  return <PaymentHistoryPage />;
}
