import type { Metadata } from "next";
import { CampaignReviewQueue } from "@/components/sponsorship/campaign-review";

export const metadata: Metadata = { title: "Advertising Reviews" };

export default function Page() {
  return <CampaignReviewQueue family="advertising" title="Advertising reviews" description="Featured placements, homepage features and banners." />;
}
