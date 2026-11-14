import type { Metadata } from "next";
import { SavedBusinesses } from "@/components/dashboard/saved-businesses";

export const metadata: Metadata = { title: "Saved Businesses" };

export default function Page() {
  return <SavedBusinesses />;
}
