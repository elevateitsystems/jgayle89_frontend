import type { Metadata } from "next";
import { MyMembershipPage } from "@/components/dashboard/member-pages";

export const metadata: Metadata = { title: "My Membership" };

export default function Page() {
  return <MyMembershipPage />;
}
