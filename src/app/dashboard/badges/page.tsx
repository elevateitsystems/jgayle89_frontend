import type { Metadata } from "next";
import { OwnerBadgesPage } from "@/components/badges/owner-badges";

export const metadata: Metadata = { title: "Badges & Verification" };

export default function Page() {
  return <OwnerBadgesPage />;
}
