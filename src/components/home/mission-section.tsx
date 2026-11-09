import Image from "next/image";
import { Handshake, Search, Users } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const pillars = [
  {
    icon: Search,
    title: "Discover",
    body: "Search a growing directory of veteran-owned businesses by name, location and category.",
  },
  {
    icon: Handshake,
    title: "Support",
    body: "Choose businesses built by those who served and keep your spending inside the community.",
  },
  {
    icon: Users,
    title: "Connect",
    body: "Meet fellow veterans, founders and supporters at events — in person and online.",
  },
];

export function MissionSection() {
  return (
    <section id="mission" className="section-y scroll-mt-24" aria-labelledby="mission-heading">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="relative">
          <div className="relative aspect-[5/4] overflow-hidden rounded-lg shadow-lift">
            <Image
              src="/images/navy-flag-detail.jpg"
              alt="U.S. Navy sailors in dress whites holding an American flag during a ceremony"
              fill
              sizes="(min-width: 1024px) 560px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 right-4 max-w-[15rem] rounded-lg bg-olive-800 p-5 text-white shadow-lift sm:-right-6">
            <p className="font-heading text-3xl font-semibold text-sand-200">Mission first.</p>
            <p className="mt-1 text-sm text-olive-100/85">Every listing is a veteran with a story and a trade.</p>
          </div>
        </div>

        <div>
          <SectionHeading
          id="mission-heading"
            eyebrow="Our mission"
            title="A SITREP for the veteran business community"
            description="In the field, a situation report keeps everyone informed and moving together. Mission: SITREP does the same for veteran entrepreneurs and the neighbors who want to support them — one trusted place to see who's out there, what they do, and how to reach them."
          />
          <ul className="mt-8 space-y-5">
            {pillars.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-olive-100 text-olive-700">
                  <p.icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-olive-950">{p.title}</h3>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
