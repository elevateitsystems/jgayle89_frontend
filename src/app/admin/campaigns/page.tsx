import type { Metadata } from "next";
import { CampaignReviewQueue } from "@/components/sponsorship/campaign-review";

export const metadata: Metadata = { title: "Advertising Campaigns" };

export default function Page() {
  return <CampaignReviewQueue title="Advertising campaigns" description="Every advertising and sponsorship campaign. You can review and schedule any of them." />;
}
