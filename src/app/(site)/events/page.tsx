import type { Metadata } from "next";
import { EventsClient } from "@/components/events/events-client";

export const metadata: Metadata = {
  title: "Community Events",
  description: "Upcoming networking mixers, career fairs, workshops and outings for the veteran community.",
};

export default function EventsPage() {
  return <EventsClient />;
}
