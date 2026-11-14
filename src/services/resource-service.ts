import { resources } from "@/lib/mock-data/resources";
import type { CommunityResource, ResourceKind } from "@/types";

/**
 * Community / career / financial resources (demo implementation over a static list).
 * Replace with the resources API; public community resources must stay readable without a paid plan.
 */
export const resourceService = {
  all: (): CommunityResource[] => resources,
  byId: (id: string) => resources.find((r) => r.id === id),
  byKinds: (kinds: ResourceKind[], audience?: "veteran" | "civilian" | "business") =>
    resources.filter((r) => kinds.includes(r.kind) && (!audience || audience === "business" || r.audience === "all" || r.audience === audience)),
};
