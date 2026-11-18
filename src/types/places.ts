/** Veteran organizations and community resources with a location, used by the Near Me finder. */

export type OrganizationKind = "vfw_post" | "american_legion" | "veteran_org" | "nonprofit" | "community_resource";

export interface Organization {
  id: string;
  name: string;
  kind: OrganizationKind;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
}
