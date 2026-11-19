import type { Metadata } from "next";
import { OwnerMediaPage } from "@/components/business/owner-media";

export const metadata: Metadata = { title: "Photos, Videos & Categories" };

export default function Page() {
  return <OwnerMediaPage />;
}
