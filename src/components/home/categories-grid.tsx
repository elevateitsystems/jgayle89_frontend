"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/categories";
import { CategoryIcon } from "@/lib/category-icons";
import { SectionHeading } from "@/components/shared/section-heading";
import { usePublicBusinesses } from "@/hooks/use-businesses";

export function CategoriesGrid() {
  const { businesses } = usePublicBusinesses();
  const counts = businesses.reduce<Record<string, number>>((acc, b) => {
    acc[b.category] = (acc[b.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="section-y bg-sand-100" aria-labelledby="categories-heading">
      <div className="container-page">
        <SectionHeading
          id="categories-heading"
          eyebrow="Explore"
          title="Browse by category"
          description="From the corner café to the construction crew — find veteran-owned expertise in every trade."
        />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/directory?category=${c.id}`}
                className="group relative flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-lg bg-olive-900 p-4 text-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift sm:aspect-[4/4.4]"
              >
                <Image
                  src={c.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                  className="object-cover opacity-80 transition-all duration-500 group-hover:scale-105 group-hover:opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-olive-950 via-olive-950/45 to-olive-950/5" />
                <span className="absolute left-4 top-4 flex size-10 items-center justify-center rounded-md bg-white/95 text-olive-800 shadow-sm">
                  <CategoryIcon name={c.icon} className="size-5" />
                </span>
                <ArrowUpRight className="absolute right-4 top-4 size-5 text-white/70 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" aria-hidden />
                <div className="relative">
                  <h3 className="font-heading text-lg font-semibold leading-tight sm:text-xl">{c.name}</h3>
                  <p className="mt-1 text-xs text-olive-100/80">
                    {counts[c.id] ?? 0} {(counts[c.id] ?? 0) === 1 ? "business" : "businesses"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
