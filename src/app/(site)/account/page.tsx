import type { Metadata } from "next";
import { AccountClient } from "@/components/account/account-client";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

export default function AccountPage() {
  return <AccountClient />;
}
