import type { Metadata } from "next";
import { AccountSettings } from "@/components/dashboard/member-pages";

export const metadata: Metadata = { title: "Account Settings" };

export default function Page() {
  return <AccountSettings />;
}
