import type { Metadata } from "next";
import { SubscriptionsAdmin } from "@/components/membership/subscriptions-admin";

export const metadata: Metadata = { title: "Subscriptions" };

export default function Page() {
  return <SubscriptionsAdmin />;
}
