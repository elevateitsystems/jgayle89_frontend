import { CategoriesGrid } from "@/components/home/categories-grid";
import { CtaSection } from "@/components/home/cta-section";
import { EventsSection } from "@/components/home/events-section";
import { FeaturedBusinesses } from "@/components/home/featured-businesses";
import { Hero } from "@/components/home/hero";
import { MapSection } from "@/components/home/map-section";
import { MissionSection } from "@/components/home/mission-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedBusinesses />
      <CategoriesGrid />
      <MapSection />
      <EventsSection />
      <MissionSection />
      <CtaSection />
    </>
  );
}
