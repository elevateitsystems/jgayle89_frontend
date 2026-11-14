import type { Metadata } from "next";
import { CommunityPage } from "@/components/dashboard/member-pages";

export const metadata: Metadata = { title: "Community Resources" };

export default function Page() {
  return <CommunityPage />;
}
