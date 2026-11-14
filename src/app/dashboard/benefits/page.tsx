import type { Metadata } from "next";
import { MemberBenefits } from "@/components/dashboard/member-benefits";

export const metadata: Metadata = { title: "Benefits Directory" };

export default function Page() {
  return <MemberBenefits />;
}
