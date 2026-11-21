import type { Metadata } from "next";
import { BadgeHoldersPage } from "@/components/badges/badge-holders-page";

export const metadata: Metadata = { title: "Badge holders" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BadgeHoldersPage badgeId={id} />;
}
