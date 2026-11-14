import type { Metadata } from "next";
import { CampaignReviewQueue } from "@/components/sponsorship/campaign-review";

export const metadata: Metadata = { title: "Sponsorship Approvals" };

export default function Page() {
  return <CampaignReviewQueue family="sponsorship" title="Sponsorship approvals" description="Event, city/state, newsletter and resource sponsorships." />;
}
