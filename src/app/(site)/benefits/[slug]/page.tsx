import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BenefitDetailBySlug } from "@/components/benefits/benefit-detail";
import { siteConfig } from "@/config/site";
import { benefits } from "@/data/benefits";

export function generateStaticParams() {
  return benefits.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: PageProps<"/benefits/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const b = benefits.find((x) => x.slug === slug);
  return b ? { title: b.title, description: b.summary } : { title: "Benefit" };
}

export default async function BenefitPage({ params }: PageProps<"/benefits/[slug]">) {
  const { slug } = await params;
  if (!siteConfig.features.benefits) notFound();
  // Staff-added programs aren't in the static list, so the client resolves them from the live catalogue.
  return <BenefitDetailBySlug slug={slug} initial={benefits.find((x) => x.slug === slug)} />;
}
