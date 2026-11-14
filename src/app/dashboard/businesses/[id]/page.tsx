import type { Metadata } from "next";
import { BusinessDetailOwner } from "@/components/business/business-detail-owner";

export const metadata: Metadata = { title: "Manage business" };

export default async function Page({ params }: PageProps<"/dashboard/businesses/[id]">) {
  const { id } = await params;
  return <BusinessDetailOwner id={id} />;
}
