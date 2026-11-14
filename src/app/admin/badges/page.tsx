import type { Metadata } from "next";
import { BadgesAdmin } from "@/components/badges/badges-admin";

export const metadata: Metadata = { title: "Badges" };

export default function Page() {
  return <BadgesAdmin />;
}
