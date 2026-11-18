import type { Organization } from "../../types/index.ts";

/**
 * DEMO DATA — sample veteran organizations and community resources for the Near Me finder. Every entry is
 * FICTIONAL (names say "Sample", contact details are placeholders). Replace with verified listings — never
 * publish invented post numbers or addresses for real organizations.
 */
type Seed = Omit<Organization, "id">;

const seeds: Seed[] = [
  // Fayetteville, NC
  { name: "Sample VFW Post · Fayetteville", kind: "vfw_post", description: "Sample listing showing how a local VFW post appears.", address: "100 Sample Post Road", city: "Fayetteville", state: "NC", zip: "28303", lat: 35.0712, lng: -78.9012 },
  { name: "Sample American Legion Post · Fayetteville", kind: "american_legion", description: "Sample American Legion post listing.", address: "220 Sample Legion Way", city: "Fayetteville", state: "NC", zip: "28301", lat: 35.0431, lng: -78.8619 },
  { name: "Sample Veteran Housing Nonprofit · Fayetteville", kind: "nonprofit", description: "Sample veteran-focused nonprofit helping with housing searches.", address: "55 Sample Hope Street", city: "Fayetteville", state: "NC", zip: "28305", lat: 35.0603, lng: -78.9221 },
  { name: "Sample Food Pantry · Spring Lake", kind: "community_resource", description: "Sample community food pantry open to military families.", address: "12 Sample Pantry Lane", city: "Spring Lake", state: "NC", zip: "28390", lat: 35.1890, lng: -79.0050 },
  // Colorado Springs, CO
  { name: "Sample VFW Post · Colorado Springs", kind: "vfw_post", description: "Sample VFW post listing.", address: "301 Sample Summit Ave", city: "Colorado Springs", state: "CO", zip: "80903", lat: 38.8461, lng: -104.8003 },
  { name: "Sample Veterans Coalition · Colorado Springs", kind: "veteran_org", description: "Sample veteran service organization offering peer support.", address: "77 Sample Peak Blvd", city: "Colorado Springs", state: "CO", zip: "80909", lat: 38.8712, lng: -104.7701 },
  { name: "Sample Family Resource Center · Fountain", kind: "community_resource", description: "Sample family resource center near Fort Carson.", address: "18 Sample Fountain Rd", city: "Fountain", state: "CO", zip: "80817", lat: 38.6822, lng: -104.7008 },
  // San Antonio, TX
  { name: "Sample American Legion Post · San Antonio", kind: "american_legion", description: "Sample American Legion post listing.", address: "410 Sample Alamo St", city: "San Antonio", state: "TX", zip: "78205", lat: 29.4301, lng: -98.4899 },
  { name: "Sample Veteran Legal Aid · San Antonio", kind: "nonprofit", description: "Sample nonprofit offering free legal clinics for veterans.", address: "90 Sample Riverwalk", city: "San Antonio", state: "TX", zip: "78205", lat: 29.4198, lng: -98.4812 },
  // Killeen, TX
  { name: "Sample VFW Post · Killeen", kind: "vfw_post", description: "Sample VFW post listing.", address: "15 Sample Hood Rd", city: "Killeen", state: "TX", zip: "76541", lat: 31.1201, lng: -97.7350 },
  { name: "Sample Transition Assistance Center · Killeen", kind: "community_resource", description: "Sample community resource for transitioning service members.", address: "60 Sample Transition Way", city: "Killeen", state: "TX", zip: "76541", lat: 31.1102, lng: -97.7189 },
  // Tampa, FL
  { name: "Sample American Legion Post · Tampa", kind: "american_legion", description: "Sample American Legion post listing.", address: "88 Sample Bayshore Blvd", city: "Tampa", state: "FL", zip: "33611", lat: 27.8954, lng: -82.4981 },
  { name: "Sample Veteran Employment Nonprofit · Tampa", kind: "nonprofit", description: "Sample nonprofit connecting veterans with employers.", address: "200 Sample Harbor St", city: "Tampa", state: "FL", zip: "33602", lat: 27.9506, lng: -82.4572 },
  // Norfolk, VA
  { name: "Sample VFW Post · Norfolk", kind: "vfw_post", description: "Sample VFW post listing.", address: "14 Sample Harbor Dr", city: "Norfolk", state: "VA", zip: "23510", lat: 36.8468, lng: -76.2852 },
  { name: "Sample Fleet Reserve Association Branch · Norfolk", kind: "veteran_org", description: "Sample veteran organization listing for Navy, Marine Corps and Coast Guard members.", address: "40 Sample Pier Rd", city: "Norfolk", state: "VA", zip: "23511", lat: 36.9301, lng: -76.3102 },
];

export const organizations: Organization[] = seeds.map((s, i) => ({ ...s, id: `org_${String(i + 1).padStart(3, "0")}` }));

/**
 * Approximate demo ZIP centroids (no geocoding service is connected). Business ZIPs are added from their own
 * coordinates in features/near-me. Replace with a real geocoding/ZIP API.
 */
export const zipCentroids: Record<string, { lat: number; lng: number; label: string }> = {
  "28301": { lat: 35.0527, lng: -78.8784, label: "Fayetteville, NC" },
  "28303": { lat: 35.0746, lng: -78.9586, label: "Fayetteville, NC" },
  "28305": { lat: 35.0553, lng: -78.9086, label: "Fayetteville, NC" },
  "28390": { lat: 35.1890, lng: -79.0050, label: "Spring Lake, NC" },
  "80903": { lat: 38.8339, lng: -104.8214, label: "Colorado Springs, CO" },
  "80909": { lat: 38.8521, lng: -104.7754, label: "Colorado Springs, CO" },
  "80817": { lat: 38.6822, lng: -104.7008, label: "Fountain, CO" },
  "78205": { lat: 29.4246, lng: -98.4951, label: "San Antonio, TX" },
  "76541": { lat: 31.1171, lng: -97.7278, label: "Killeen, TX" },
  "33611": { lat: 27.8906, lng: -82.5065, label: "Tampa, FL" },
  "33602": { lat: 27.9506, lng: -82.4572, label: "Tampa, FL" },
  "23510": { lat: 36.8508, lng: -76.2859, label: "Norfolk, VA" },
  "23511": { lat: 36.9370, lng: -76.3001, label: "Norfolk, VA" },
  "23451": { lat: 36.8529, lng: -75.978, label: "Virginia Beach, VA" },
  "92101": { lat: 32.7157, lng: -117.1611, label: "San Diego, CA" },
  "80202": { lat: 39.7392, lng: -104.9903, label: "Denver, CO" },
  "32202": { lat: 30.3322, lng: -81.6557, label: "Jacksonville, FL" },
  "59715": { lat: 45.677, lng: -111.0429, label: "Bozeman, MT" },
};
