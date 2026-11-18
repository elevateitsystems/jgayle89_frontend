/**
 * Near Me (client update §3). Pure: distance maths, merging the different kinds of places into one list,
 * and radius filtering. The map/list UI and the location sources (geolocation or ZIP) live in the component.
 */
import type { Business, CommunityEvent, Organization, OrganizationKind } from "../../types/index.ts";

export type NearbyKind =
  | "veteran_owned"
  | "veteran_friendly"
  | "event"
  | "vfw_post"
  | "american_legion"
  | "nonprofit"
  | "community_resource";

export const NEARBY_KIND_LABEL: Record<NearbyKind, string> = {
  veteran_owned: "Veteran-owned business",
  veteran_friendly: "Veteran-friendly business",
  event: "Military / veteran event",
  vfw_post: "VFW post",
  american_legion: "American Legion & veteran organizations",
  nonprofit: "Veteran-focused nonprofit",
  community_resource: "Community resources & assistance",
};
export const NEARBY_KINDS = Object.keys(NEARBY_KIND_LABEL) as NearbyKind[];

export const RADIUS_OPTIONS = [10, 25] as const;
export type Radius = (typeof RADIUS_OPTIONS)[number];

export interface LatLng {
  lat: number;
  lng: number;
}

export interface NearbyPlace extends LatLng {
  id: string;
  kind: NearbyKind;
  name: string;
  subtitle: string;
  href: string;
  /** External links open in a new tab. */
  external: boolean;
}

export interface NearbyResult extends NearbyPlace {
  miles: number;
}

/** Great-circle distance in miles. */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const ORG_KIND: Record<OrganizationKind, NearbyKind> = {
  vfw_post: "vfw_post",
  american_legion: "american_legion",
  veteran_org: "american_legion",
  nonprofit: "nonprofit",
  community_resource: "community_resource",
};

/**
 * Everything the finder can show. Businesses in the "Community Resources & Assistance" category (primary or
 * secondary) are listed as community resources; online events have no place and are skipped.
 */
export function buildPlaces(input: { businesses: Business[]; events: CommunityEvent[]; organizations: Organization[]; communityCategoryId?: string; today: string }): NearbyPlace[] {
  const community = input.communityCategoryId ?? "community-resources";
  const biz: NearbyPlace[] = input.businesses
    .filter((b) => b.status === "active")
    .map((b) => {
      const isCommunity = b.category === community || (b.secondaryCategories ?? []).includes(community);
      const kind: NearbyKind = isCommunity ? "community_resource" : b.listingKind === "veteran_friendly" ? "veteran_friendly" : "veteran_owned";
      return { id: b.id, kind, name: b.name, subtitle: `${b.city}, ${b.state}`, href: `/directory/${b.slug}`, external: false, lat: b.lat, lng: b.lng };
    });
  const ev: NearbyPlace[] = input.events
    .filter((e) => e.status === "published" && e.date >= input.today && e.city !== "Online")
    .map((e) => ({ id: e.id, kind: "event", name: e.title, subtitle: `${e.venue} · ${e.date}`, href: `/events/${e.slug}`, external: false, lat: e.lat, lng: e.lng }));
  const orgs: NearbyPlace[] = input.organizations.map((o) => ({
    id: o.id, kind: ORG_KIND[o.kind], name: o.name, subtitle: `${o.address}, ${o.city}, ${o.state}`,
    href: o.website ?? `https://www.openstreetmap.org/?mlat=${o.lat}&mlon=${o.lng}#map=16/${o.lat}/${o.lng}`, external: true, lat: o.lat, lng: o.lng,
  }));
  return [...biz, ...ev, ...orgs];
}

/** Places within `radius` miles of `center`, nearest first, optionally limited to some kinds. */
export function nearby(places: NearbyPlace[], center: LatLng, radius: number, kinds: NearbyKind[] = []): NearbyResult[] {
  return places
    .filter((p) => kinds.length === 0 || kinds.includes(p.kind))
    .map((p) => ({ ...p, miles: distanceMiles(center, p) }))
    .filter((p) => p.miles <= radius)
    .sort((a, b) => a.miles - b.miles || a.name.localeCompare(b.name));
}

export const isZip = (s: string) => /^\d{5}$/.test(s.trim());

export const formatMiles = (m: number) => (m < 0.1 ? "< 0.1 mi" : `${m < 10 ? m.toFixed(1) : Math.round(m)} mi`);
