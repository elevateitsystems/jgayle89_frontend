import type { ActivityItem, DashboardStat, TimeseriesPoint } from "@/types";

/** DEMO DATA — dashboard figures are invented for the Phase 1 prototype. */
export const dashboardStats: DashboardStat[] = [
  { id: "listings", label: "Total listings", value: 0, delta: 12.4, hint: "vs. last 30 days" },
  { id: "events", label: "Upcoming events", value: 0, delta: 8.0, hint: "published" },
  { id: "visitors", label: "Monthly visitors", value: 18420, delta: 15.6, hint: "demo analytics" },
  { id: "searches", label: "Directory searches", value: 6934, delta: -2.3, hint: "demo analytics" },
];

export const listingsGrowth: TimeseriesPoint[] = [
  { label: "May", value: 4 },
  { label: "Jun", value: 6 },
  { label: "Jul", value: 5 },
  { label: "Aug", value: 9 },
  { label: "Sep", value: 8 },
  { label: "Oct", value: 12 },
];

export const visitorsTrend: TimeseriesPoint[] = [
  { label: "Week 1", value: 3820 },
  { label: "Week 2", value: 4210 },
  { label: "Week 3", value: 4650 },
  { label: "Week 4", value: 5120 },
];

export const recentActivity = (now: number): ActivityItem[] => {
  const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
  return [
  { id: "a1", type: "business", message: "New listing submitted: Frontline Photo & Film", actor: "Demo Admin", time: ago(18) },
  { id: "a2", type: "event", message: "Event published: Honor Run 5K & Community Walk", actor: "Events Team", time: ago(95) },
  { id: "a3", type: "import", message: "CSV import completed — 14 rows added, 2 skipped", actor: "Demo Admin", time: ago(260) },
  { id: "a4", type: "user", message: "New member registered from Norfolk, VA", actor: "System", time: ago(520) },
  { id: "a5", type: "business", message: "Listing updated: Ironwood Coffee Roasters", actor: "Demo Admin", time: ago(1180) },
  { id: "a6", type: "review", message: "Demo rating flagged for review on Longhaul Logistics Group", actor: "Moderation", time: ago(2600) },
];
};
