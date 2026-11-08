import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BenefitDetail } from "@/components/benefits/benefit-detail";
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
  const benefit = benefits.find((x) => x.slug === slug);
  if (!benefit) notFound();
  return <BenefitDetail benefit={benefit} />;
}
