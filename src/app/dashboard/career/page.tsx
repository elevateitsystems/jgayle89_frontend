import type { Metadata } from "next";
import { CareerPage } from "@/components/dashboard/member-pages";

export const metadata: Metadata = { title: "Career Resources" };

export default function Page() {
  return <CareerPage />;
}
