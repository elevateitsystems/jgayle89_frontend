import { CategoriesGrid } from "@/components/home/categories-grid";
import { CtaSection } from "@/components/home/cta-section";
import { EventsSection } from "@/components/home/events-section";
import { FeaturedBusinesses } from "@/components/home/featured-businesses";
import { FreebiesSection } from "@/components/home/freebies-section";
import { Hero } from "@/components/home/hero";
import { MapSection } from "@/components/home/map-section";
import { MissionSection } from "@/components/home/mission-section";
import { PromotionsSection } from "@/components/home/promotions-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedBusinesses />
      <CategoriesGrid />
      <FreebiesSection />
      <PromotionsSection />
      <MapSection />
      <EventsSection />
      <MissionSection />
      <CtaSection />
    </>
  );
}
