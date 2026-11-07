import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CtaSection() {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24" aria-labelledby="cta-heading">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-xl bg-olive-800 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        <div className="topo-bg absolute inset-0 opacity-[0.18]" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <p className="eyebrow !text-olive-200">Join the mission</p>
          <h2 id="cta-heading" className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-5xl">
            Own a business? Put it on the map.
          </h2>
          <p className="mt-4 text-base text-olive-100/85 sm:text-lg">
            Create a free account to get listed, share your events, and be found by customers who want to support veteran-owned
            businesses.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className={cn(buttonVariants({ variant: "light", size: "lg" }))}>
              Create a free account <ArrowRight />
            </Link>
            <Link
              href="/directory"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "border-olive-500 bg-transparent text-white hover:bg-olive-700 hover:text-white",
              )}
            >
              Browse the directory
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
