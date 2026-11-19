import type { Metadata } from "next";
import { NearMe } from "@/components/dashboard/near-me";

export const metadata: Metadata = { title: "Near Me" };

export default function Page() {
  return <NearMe />;
}
