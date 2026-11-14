"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Percent,
  Share2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import { BusinessCard } from "./business-card";
import { SaveBusinessButton } from "./save-business-button";
import { BadgeDetailList, BadgeRow } from "@/components/badges/business-badge";
import { HiringChip } from "@/components/business/hiring-toggle";
import { SocialLinksList } from "@/components/business/social-links";
import { StatusPill } from "@/components/dashboard/status-pill";
import { useBusinessBadges } from "@/features/badges/hooks";
import { todayISO, formatDate } from "@/lib/date";
import { BusinessAvatar } from "@/components/shared/monogram";
import { DemoNotice } from "@/components/shared/demo-notice";
import { EmptyState } from "@/components/shared/empty-state";
import { MapView } from "@/components/shared/map-view";
import { RatingPills } from "@/components/ratings/rating-pills";
import { RatingsSection } from "@/components/ratings/ratings-section";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { useBusiness, usePublicBusinesses } from "@/hooks/use-businesses";
import { useCategories } from "@/hooks/use-categories";
import { useGoogleRating } from "@/hooks/use-google-rating";
import { useBusinessReviews } from "@/hooks/use-reviews";
import { useSiteSettings } from "@/hooks/use-settings";
import { shouldShowGoogleRating } from "@/lib/ratings";
import { cn } from "@/lib/utils";

export function BusinessDetail({ slug }: { slug: string }) {
  const { business: b, loading } = useBusiness({ slug });
  const { businesses } = usePublicBusinesses();
  const { categoryById } = useCategories();
  const settings = useSiteSettings();
  const reviews = useBusinessReviews(b?.id);
  const { google, loading: googleLoading } = useGoogleRating(b);
  const badges = useBusinessBadges(b?.id);

  const related = useMemo(() => {
    if (!b) return [];
    return businesses
      .filter((x) => x.id !== b.id)
      .map((x) => ({ x, score: (x.category === b.category ? 2 : 0) + (x.state === b.state ? 1 : 0) + x.rating / 10 }))
      .sort((a, c) => c.score - a.score)
      .slice(0, 3)
      .map((r) => r.x);
  }, [b, businesses]);

  if (loading && !b) return <DetailSkeleton />;

  if (!b) {
    return (
      <div className="container-page py-20">
        <EmptyState title="Business not found" description="This listing may have been removed or the link is incorrect.">
          <Link href="/directory" className={cn(buttonVariants(), "mt-6")}>
            Back to directory
          </Link>
        </EmptyState>
      </div>
    );
  }

  const category = categoryById(b.category);
  const activePromos = (b.promotions ?? []).filter((p) => !p.validUntil || p.validUntil >= todayISO());
  const fullAddress = `${b.address}, ${b.city}, ${b.state} ${b.zip}`;
  const directionsHref = `https://www.openstreetmap.org/directions?to=${b.lat}%2C${b.lng}`;

  return (
    <>
      {/* Cover */}
      <div className="relative h-56 w-full bg-olive-900 sm:h-72 lg:h-96">
        <Image src={b.coverImage} alt={`${b.name} cover`} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-olive-950/70 via-olive-950/10 to-olive-950/30" />
        <div className="container-page relative flex h-full items-start pt-5">
          <Link
            href="/directory"
            className="inline-flex items-center gap-1.5 rounded-md bg-white/90 px-3 py-2 text-sm font-medium text-olive-900 shadow-sm backdrop-blur hover:bg-white"
          >
            <ArrowLeft className="size-4" aria-hidden /> Directory
          </Link>
        </div>
      </div>

      <div className="container-page">
        {b.status !== "active" && (
          <p className="mt-6 rounded-md border border-brass/40 bg-brass-soft px-4 py-2.5 text-sm text-sand-700">
            <strong className="font-semibold capitalize">{b.status}</strong> listing — only visible to admins in this demo. It does not appear in the public directory.
          </p>
        )}

        {/* Header card */}
        <div className="relative -mt-14 rounded-lg border bg-card p-5 shadow-lift sm:-mt-20 sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start">
            <BusinessAvatar
              name={b.name}
              src={b.profileImage}
              className="-mt-14 size-24 rounded-lg border-4 border-white shadow-md sm:-mt-16 sm:size-28 md:-mt-14"
              textClassName="text-3xl"
            />
            <div className="min-w-0 flex-1">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                <Link href="/directory" className="hover:text-foreground hover:underline">Directory</Link>
                <ChevronRight className="size-3" aria-hidden />
                <Link href={`/directory?category=${b.category}`} className="hover:text-foreground hover:underline">
                  {category?.name}
                </Link>
              </nav>
              <h1 className="mt-2 text-3xl font-semibold leading-tight text-olive-950 sm:text-4xl">{b.name}</h1>
              <p className="mt-1.5 text-base text-muted-foreground">{b.tagline}</p>
              <div className="mt-4">
                <RatingPills business={b} google={shouldShowGoogleRating(settings, google) ? google : null} />
              </div>
              <BadgeRow businessId={b.id} size="md" className="mt-3" leading={b.hiring ? <HiringChip hiring className="px-3 py-1 text-xs" /> : undefined} />
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="size-4 text-olive-600" aria-hidden /> {b.city}, {b.state}
                </span>
                <span className="inline-flex items-center gap-1.5 font-medium text-olive-700">
                  <BadgeCheck className="size-4" aria-hidden /> Veteran-owned · {b.branch}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row md:flex-col lg:flex-row">
              <a href={`tel:${b.phone}`} className={cn(buttonVariants({ size: "lg" }))}>
                <Phone /> Call
              </a>
              <SaveBusinessButton businessId={b.id} businessName={b.name} />
              {b.website && (
                <a href={b.website} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  <Globe /> Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 pb-16 lg:grid-cols-12 lg:gap-10">
          <div className="space-y-10 lg:col-span-8">
            <section aria-labelledby="about-h">
              <h2 id="about-h" className="text-2xl font-semibold text-olive-950">About {b.name}</h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-foreground/85">
                {b.description.split("\n\n").map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>

            {b.services.length > 0 && (
              <section aria-labelledby="services-h">
                <h2 id="services-h" className="text-2xl font-semibold text-olive-950">Services</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {b.services.map((s) => (
                    <li key={s} className="flex items-center gap-3 rounded-md border bg-white px-4 py-3 text-sm font-medium">
                      <span className="flex size-6 items-center justify-center rounded-full bg-olive-100 text-olive-700">
                        <Check className="size-3.5" aria-hidden />
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {activePromos.length > 0 && (
              <section aria-labelledby="offers-h">
                <h2 id="offers-h" className="text-2xl font-semibold text-olive-950">Offers</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {activePromos.map((p) => (
                    <li key={p.id} className="rounded-md border border-brass/40 bg-brass-soft/50 p-4">
                      <div className="flex flex-wrap items-center gap-2"><StatusPill tone="warn"><Percent className="size-3" aria-hidden /> {p.discountText}</StatusPill></div>
                      <p className="mt-2 font-semibold text-olive-950">{p.title}</p>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{p.audience === "veterans" ? "For veterans & military" : p.audience === "first_responders" ? "For first responders" : "For everyone"}{p.validUntil ? ` · until ${formatDate(p.validUntil)}` : ""}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {badges.length > 0 && (
              <section aria-labelledby="badges-h">
                <h2 id="badges-h" className="text-2xl font-semibold text-olive-950">Badges</h2>
                <p className="mt-2 text-sm text-muted-foreground">Badges are verified by Mission: SITREP staff — they are never part of a paid plan.</p>
                <div className="mt-4"><BadgeDetailList businessId={b.id} /></div>
              </section>
            )}

            <RatingsSection
              business={b}
              reviews={reviews}
              google={google}
              googleLoading={googleLoading}
              googleEnabled={settings.showGoogleRatings}
            />

            <section aria-labelledby="loc-h">
              <h2 id="loc-h" className="text-2xl font-semibold text-olive-950">Location</h2>
              <p className="mt-2 text-muted-foreground">{fullAddress}</p>
              <MapView
                markers={[{ id: b.id, lat: b.lat, lng: b.lng, title: b.name, subtitle: `${b.city}, ${b.state}` }]}
                selectedId={b.id}
                className="mt-4 h-72 sm:h-96"
              />
              <a
                href={directionsHref}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
              >
                <Navigation /> Get directions <ExternalLink className="size-3.5" />
              </a>
            </section>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="rounded-lg border bg-card p-5 shadow-card lg:sticky lg:top-36">
              <h2 className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-olive-700">Contact & info</h2>
              <ul className="mt-5 space-y-4 text-sm">
                <InfoRow icon={MapPin} label="Address">
                  {b.address}<br />{b.city}, {b.state} {b.zip}
                </InfoRow>
                <InfoRow icon={Phone} label="Phone">
                  <a href={`tel:${b.phone}`} className="text-olive-700 underline-offset-2 hover:underline">{b.phone}</a>
                </InfoRow>
                <InfoRow icon={Mail} label="Email">
                  <a href={`mailto:${b.email}`} className="break-all text-olive-700 underline-offset-2 hover:underline">{b.email}</a>
                </InfoRow>
                {b.website && (
                  <InfoRow icon={Globe} label="Website">
                    <a href={b.website} target="_blank" rel="noopener noreferrer" className="break-all text-olive-700 underline-offset-2 hover:underline">
                      {b.website.replace(/^https?:\/\//, "")}
                    </a>
                  </InfoRow>
                )}
                {(b.socialLinks?.length ?? 0) > 0 && (
                  <InfoRow icon={Share2} label="Find us online">
                    <SocialLinksList links={b.socialLinks ?? []} variant="icons" className="mt-1" />
                  </InfoRow>
                )}
                <InfoRow icon={Clock} label="Hours">{b.hours || "Contact for hours"}</InfoRow>
                <InfoRow icon={CalendarDays} label="Established">{b.yearFounded}</InfoRow>
              </ul>
              <DemoNotice className="mt-6" />
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-h" className="border-t border-sand-200 pb-20 pt-12">
            <h2 id="related-h" className="text-2xl font-semibold text-olive-950 sm:text-3xl">Related businesses</h2>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <BusinessCard business={r} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-olive-100 text-olive-700">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <div className="mt-0.5 leading-relaxed text-foreground">{children}</div>
      </div>
    </li>
  );
}

function DetailSkeleton() {
  return (
    <>
      <Skeleton className="h-72 w-full rounded-none lg:h-96" />
      <div className="container-page -mt-16">
        <Skeleton className="h-44 w-full" />
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-8">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-72 lg:col-span-4" />
        </div>
      </div>
    </>
  );
}
