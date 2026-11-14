import { businesses } from "../../data/businesses.ts";
import type { BusinessChanges, BusinessEditRequest, EditableFieldKey } from "../../types/index.ts";

/** DEMO DATA — a mix of pending, approved, rejected and changes-requested edit requests. */
const biz = (id: string) => {
  const b = businesses.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown business ${id}`);
  return b;
};
const snap = (id: string, keys: EditableFieldKey[]): BusinessChanges => {
  const b = biz(id);
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = b[k as keyof typeof b];
  return out as BusinessChanges;
};

type Seed = Pick<BusinessEditRequest, "id" | "businessId" | "requesterId" | "requesterName" | "status" | "reason" | "changes" | "createdAt"> &
  Partial<Pick<BusinessEditRequest, "reviewerName" | "reviewNote" | "updatedAt" | "attachments">>;

function build(s: Seed): BusinessEditRequest {
  const b = biz(s.businessId);
  const history: BusinessEditRequest["history"] = [{ at: s.createdAt, by: s.requesterName, action: "submitted" }];
  if (s.status !== "pending") {
    history.push({
      at: s.updatedAt ?? s.createdAt, by: s.reviewerName ?? "Staff",
      action: s.status === "approved" ? "approved" : s.status === "rejected" ? "rejected" : "changes_requested", note: s.reviewNote,
    });
  }
  return {
    attachments: [], updatedAt: s.createdAt, ...s,
    businessName: b.name,
    before: snap(s.businessId, Object.keys(s.changes) as EditableFieldKey[]),
    history,
  };
}

export const editRequests: BusinessEditRequest[] = [
  build({
    id: "er_001", businessId: "biz_001", requesterId: "usr_014", requesterName: "Jordan Blake", status: "pending", createdAt: "2026-11-12T13:20:00Z",
    reason: "We extended Saturday hours for the holiday season and got a new front-desk line.",
    changes: { hours: "Mon–Fri 6:30a–6p · Sat 7a–6p · Sun 7a–4p", phone: "(555) 010-0199" },
  }),
  build({
    id: "er_002", businessId: "biz_002", requesterId: "usr_015", requesterName: "Avery Stone", status: "pending", createdAt: "2026-11-11T16:02:00Z",
    reason: "Adding our new Facebook page and YouTube channel.",
    changes: { socialLinks: [{ platform: "instagram", url: "https://instagram.com/summitrally.example" }, { platform: "facebook", url: "https://facebook.com/summitrallybrewing.example" }, { platform: "youtube", url: "https://youtube.com/@summitrally.example" }] },
  }),
  build({
    id: "er_003", businessId: "biz_005", requesterId: "usr_016", requesterName: "Dana Cruz", status: "changes_requested", createdAt: "2026-11-05T11:15:00Z", updatedAt: "2026-11-06T09:30:00Z",
    reason: "Refreshing our about section with recent projects.",
    changes: { tagline: "Veteran-built homes and renovations across the Texas Hill Country — licensed, bonded, on schedule." },
    reviewerName: "Sam Rivera", reviewNote: "Taglines are limited to 120 characters. Please shorten and resubmit.",
  }),
  build({
    id: "er_004", businessId: "biz_003", requesterId: "usr_014", requesterName: "Jordan Blake", status: "approved", createdAt: "2026-10-20T10:00:00Z", updatedAt: "2026-10-21T14:10:00Z",
    reason: "Linking our Instagram account.",
    changes: { socialLinks: [{ platform: "facebook", url: "https://facebook.com/fieldstonebakehouse.example" }, { platform: "instagram", url: "https://instagram.com/fieldstonebakehouse.example" }] },
    reviewerName: "Sam Rivera", reviewNote: "Links verified.",
  }),
  build({
    id: "er_005", businessId: "biz_011", requesterId: "usr_017", requesterName: "Marcus Reed", status: "rejected", createdAt: "2026-10-02T08:45:00Z", updatedAt: "2026-10-03T12:00:00Z",
    reason: "We rebranded and want the new company name shown.",
    changes: { name: "Vector Cyber Security Group" },
    reviewerName: "Sam Rivera", reviewNote: "A legal name change needs supporting documentation. Please attach the amended registration.",
  }),
  build({
    id: "er_006", businessId: "biz_010", requesterId: "usr_016", requesterName: "Dana Cruz", status: "pending", createdAt: "2026-11-13T07:55:00Z",
    reason: "Adding a standing veteran discount.",
    changes: { promotions: [{ id: "promo_new_1", title: "Free retirement-readiness review", discountText: "Free review", description: "A complimentary 45-minute review for veterans and first responders.", audience: "veterans" }] },
  }),
];
