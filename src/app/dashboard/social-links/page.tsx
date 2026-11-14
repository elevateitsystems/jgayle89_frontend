import type { Metadata } from "next";
import { SocialLinksPage } from "@/components/business/owner-pages";

export const metadata: Metadata = { title: "Social Media Links" };

export default function Page() {
  return <SocialLinksPage />;
}
