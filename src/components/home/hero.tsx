import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DirectorySearch } from "./directory-search";
import { categories } from "@/data/categories";
import { businesses } from "@/data/businesses";
import { events } from "@/data/events";

const popular = ["Coffee", "Construction", "Fitness", "Legal", "Real estate"];

export function Hero() {
  const activeCount = businesses.filter((b) => b.status === "active").length;
  const eventCount = events.filter((e) => e.status === "published").length;

  return (
    <section className="relative isolate overflow-hidden bg-olive-950 text-white">
      <div className="topo-bg absolute inset-0 -z-10 opacity-[0.16]" aria-hidden />
      <div className="absolute inset-y-0 right-0 -z-10 hidden w-1/2 bg-gradient-to-l from-olive-800/50 to-transparent lg:block" aria-hidden />

      <div className="container-page grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-12 lg:py-28">
        <div className="lg:col-span-7">
          
          <h1 className="mt-6 text-[2.5rem] font-semibold leading-[1.05] text-white sm:text-6xl lg:text-[4.25rem]">
            Find veteran-owned businesses <span className="text-sand-300">you can stand behind.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-olive-100/85 sm:text-lg">
            Mission: SITREP is a community directory of veteran-owned businesses, local resources and events — so every
            dollar you spend and every connection you make supports those who served.
          </p>

          <DirectorySearch className="mt-9 max-w-3xl" />

          <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-olive-200">
            <span className="text-olive-300">Popular:</span>
            {popular.map((p) => (
              <Link
                key={p}
                href={`/directory?q=${encodeURIComponent(p)}`}
                className="rounded-full border border-olive-700 px-3 py-1 transition-colors hover:border-olive-300 hover:bg-olive-900 hover:text-white"
              >
                {p}
              </Link>
            ))}
          </div>

          <dl className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-olive-800 pt-6">
            {[
              [`${activeCount}`, "Sample listings"],
              [`${categories.length}`, "Categories"],
              [`${eventCount - 1}+`, "Upcoming events"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="text-xs uppercase tracking-wider text-olive-300">{l}</dt>
                <dd className="mt-1 font-heading text-3xl font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>

          {/* Smaller screens don't get the photo collage, so show a single banner instead. */}
          <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg lg:hidden" aria-hidden>
            <Image src="/images/navy-flag-raising.jpg" alt="" fill sizes="(min-width: 640px) 90vw, 100vw" className="object-cover object-[35%_50%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-olive-950/40 via-transparent to-transparent" />
          </div>
        </div>

        <div className="relative hidden lg:col-span-5 lg:block" aria-hidden>
          <div className="grid h-[500px] grid-cols-5 grid-rows-6 gap-3 xl:h-[560px]">
            <div className="relative col-span-3 row-span-6 overflow-hidden rounded-lg">
              <Image src="/images/marines-color-guard.jpg" alt="" fill sizes="25vw" priority className="object-cover object-[50%_65%]" />
              <div className="absolute inset-0 bg-gradient-to-t from-olive-950/35 via-transparent to-transparent" />
            </div>
            <div className="relative col-span-2 row-span-3 overflow-hidden rounded-lg">
              <Image src="/images/navy-flag-raising.jpg" alt="" fill sizes="18vw" className="object-cover object-[35%_50%]" />
            </div>
            <div className="relative col-span-2 row-span-3 overflow-hidden rounded-lg">
              <Image src="/images/coffee.jpg" alt="" fill sizes="18vw" className="object-cover" />
            </div>
          </div>
          <div className="absolute -bottom-5 -left-6 flex items-center gap-3 rounded-lg bg-sand-50 px-4 py-3 text-olive-950 shadow-lift">
            <span className="flex size-10 items-center justify-center rounded-full bg-olive-700 text-white">
              <ArrowRight className="size-5 -rotate-45" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wider text-sand-600">Mission</p>
              <p className="text-sm font-semibold">Buy local. Hire veterans.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
