import type { Metadata } from "next";
import { BusinessDetail } from "@/components/directory/business-detail";
import { businesses } from "@/data/businesses";

export function generateStaticParams() {
  return businesses.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/directory/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = businesses.find((x) => x.slug === slug);
  return b
    ? { title: b.name, description: `${b.tagline} Sample listing in ${b.city}, ${b.state}.` }
    : { title: "Business" };
}

export default async function BusinessPage({ params }: PageProps<"/directory/[slug]">) {
  const { slug } = await params;
  return <BusinessDetail slug={slug} />;
}
