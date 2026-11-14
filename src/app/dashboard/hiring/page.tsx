import type { Metadata } from "next";
import { HiringPage } from "@/components/business/owner-pages";

export const metadata: Metadata = { title: "Hiring Status" };

export default function Page() {
  return <HiringPage />;
}
