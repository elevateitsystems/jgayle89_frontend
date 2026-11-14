import { editRequests as seed } from "@/lib/mock-data/edit-requests";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { changedKeys, editableSnapshot, effectiveChanges } from "@/features/business/changes";
import { newId } from "@/lib/slug";
import { businessService, businessStore } from "@/services/business-service";
import { requirePermission, type Requester, type Reviewer } from "@/services/actor";
import type { BusinessChanges, BusinessEditRequest, EditAttachment, EditableFieldKey } from "@/types";

/**
 * Edit-request workflow (demo implementation).
 *
 * Business Owners can NEVER write to a listing directly. They submit a request; only a staff member with
 * the `edits.review` permission can approve it, and approval is the only code path that applies the changes.
 * The API must enforce the same rule — owners must not have a write endpoint for public listing fields.
 */
export const editRequestStore = createCollectionStore<BusinessEditRequest>("edit-requests", seed);

export interface EditRequestInput {
  businessId: string;
  reason: string;
  changes: BusinessChanges;
  attachments: EditAttachment[];
  /** The owner's plan limits (null = unlimited). The API must enforce these itself. */
  caps?: { socialLinks?: number | null; promotions?: number | null };
}

const now = () => new Date().toISOString();
const all = () => editRequestStore.getSnapshot();

function ownedBusiness(businessId: string, requester: Requester) {
  const business = businessStore.getSnapshot().find((b) => b.id === businessId);
  if (!business) throw new Error("Business not found.");
  if (business.ownerId !== requester.id) throw new Error("You can only request edits for businesses you own.");
  return business;
}

function patch(id: string, changes: Partial<BusinessEditRequest>) {
  const current = all().find((r) => r.id === id);
  if (!current) throw new Error("Request not found.");
  const next = { ...current, ...changes };
  editRequestStore.set(all().map((r) => (r.id === id ? next : r)));
  return next;
}

function prepare(business: ReturnType<typeof ownedBusiness>, input: EditRequestInput) {
  const current = editableSnapshot(business);
  const changes = effectiveChanges(current, input.changes);
  const keys = changedKeys(changes);
  if (keys.length === 0) throw new Error("None of these values differ from the current listing.");
  const { socialLinks: linkCap, promotions: promoCap } = input.caps ?? {};
  if (changes.socialLinks && linkCap != null && changes.socialLinks.length > linkCap) throw new Error(`Your plan allows up to ${linkCap} social links.`);
  if (changes.promotions && promoCap != null && changes.promotions.length > promoCap) throw new Error(`Your plan allows up to ${promoCap} active promotions.`);
  const before: Record<string, unknown> = {};
  for (const k of keys as EditableFieldKey[]) before[k] = current[k];
  return { changes, before: before as BusinessChanges };
}

export const editRequestService = {
  /** Owner: ask staff to change the listing. The listing itself is untouched. */
  async submit(input: EditRequestInput, requester: Requester): Promise<BusinessEditRequest> {
    await delay(600);
    const business = ownedBusiness(input.businessId, requester);
    const { changes, before } = prepare(business, input);
    const request: BusinessEditRequest = {
      id: newId("er"),
      businessId: business.id,
      businessName: business.name,
      requesterId: requester.id,
      requesterName: requester.name,
      status: "pending",
      reason: input.reason.trim(),
      before,
      changes,
      attachments: input.attachments,
      createdAt: now(),
      updatedAt: now(),
      history: [{ at: now(), by: requester.name, action: "submitted" }],
    };
    editRequestStore.set([request, ...all()]);
    return request;
  },

  /** Owner: revise a request staff sent back, and put it back in the queue. */
  async resubmit(id: string, input: Omit<EditRequestInput, "businessId">, requester: Requester): Promise<BusinessEditRequest> {
    await delay(600);
    const req = all().find((r) => r.id === id);
    if (!req) throw new Error("Request not found.");
    if (req.status !== "changes_requested") throw new Error("Only requests with requested changes can be resubmitted.");
    const business = ownedBusiness(req.businessId, requester);
    const { changes, before } = prepare(business, { ...input, businessId: req.businessId });
    return patch(id, {
      status: "pending", reason: input.reason.trim(), changes, before, attachments: input.attachments,
      updatedAt: now(), reviewNote: undefined, reviewerName: undefined,
      history: [...req.history, { at: now(), by: requester.name, action: "resubmitted" }],
    });
  },

  /** Staff: approve, reject or send back. Approval applies the changes to the live listing. */
  async review(id: string, decision: "approve" | "reject" | "request_changes", note: string, reviewer: Reviewer): Promise<BusinessEditRequest> {
    await delay(600);
    requirePermission(reviewer, "edits.review", "review edit requests");
    const req = all().find((r) => r.id === id);
    if (!req) throw new Error("Request not found.");
    if (req.status !== "pending") throw new Error("This request has already been reviewed.");
    if (req.requesterId === reviewer.id) throw new Error("You can't review your own request.");
    if (decision !== "approve" && note.trim().length < 5) throw new Error("Add a short note so the owner knows what to do next.");

    if (decision === "approve") {
      const live = businessStore.getSnapshot().find((b) => b.id === req.businessId);
      if (!live) throw new Error("This business no longer exists.");
      await businessService.update(req.businessId, req.changes);
    }
    const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "changes_requested";
    return patch(id, {
      status, reviewerName: reviewer.name, reviewNote: note.trim() || undefined, updatedAt: now(),
      history: [...req.history, { at: now(), by: reviewer.name, action: status, note: note.trim() || undefined }],
    });
  },

  reset() {
    editRequestStore.reset();
  },
};
