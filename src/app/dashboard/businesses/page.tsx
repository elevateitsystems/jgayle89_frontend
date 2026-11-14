import type { Metadata } from "next";
import { MyBusinesses } from "@/components/business/my-businesses";

export const metadata: Metadata = { title: "My Businesses" };

export default function Page() {
  return <MyBusinesses />;
}
