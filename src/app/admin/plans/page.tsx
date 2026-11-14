import type { Metadata } from "next";
import { PlansAdmin } from "@/components/membership/plans-admin";

export const metadata: Metadata = { title: "Membership Plans" };

export default function Page() {
  return <PlansAdmin />;
}
