import { adProducts as seedProducts, campaigns as seedCampaigns, promoCredits as seedCredits } from "@/lib/mock-data/advertising";
import { createCollectionStore, delay } from "@/lib/demo-store";
import { daysFromToday } from "@/lib/date";
import { newId } from "@/lib/slug";
import { addDaysISO, slotsUsedDuring, validateTargeting } from "@/features/advertising/rules";
import { businessStore } from "@/services/business-service";
import { requireAdmin, requirePermission, type Requester, type Reviewer } from "@/services/actor";
import type { AdCampaign, AdProduct, CampaignCreative, CampaignTargeting, Permission, PromoCredit } from "@/types";

/**
 * Advertising & sponsorship data layer (demo implementation).
 *
 * Purchases are separate from membership subscriptions. This layer NEVER sets `paymentStatus` to paid:
 * payment happens through Stripe Checkout (see payments-service) and is recorded by the backend webhook.
 * A campaign can be approved and scheduled before payment, but it only goes live once it is paid.
 */
export const adProductStore = createCollectionStore<AdProduct>("ad-products", seedProducts);
export const campaignStore = createCollectionStore<AdCampaign>("campaigns", seedCampaigns);
export const creditStore = createCollectionStore<PromoCredit>("promo-credits", seedCredits);

const products = () => adProductStore.getSnapshot();
const campaigns = () => campaignStore.getSnapshot();
const nowISO = () => new Date().toISOString();

export type ProductInput = Omit<AdProduct, "id">;

export interface CampaignInput {
  productId: string;
  businessId: string;
  name: string;
  durationDays: number;
  requestedStart: string;
  targeting: CampaignTargeting;
  creative: CampaignCreative;
}

function patchCampaign(id: string, changes: Partial<AdCampaign>) {
  const current = campaigns().find((c) => c.id === id);
  if (!current) throw new Error("Campaign not found.");
  const next = { ...current, ...changes, updatedAt: nowISO() };
  campaignStore.set(campaigns().map((c) => (c.id === id ? next : c)));
  return next;
}

function validate(input: CampaignInput, requester: Requester) {
  const business = businessStore.getSnapshot().find((b) => b.id === input.businessId);
  if (!business) throw new Error("Business not found.");
  if (business.ownerId !== requester.id) throw new Error("You can only advertise businesses you own.");
  if (business.status !== "active") throw new Error("Only published listings can be advertised.");
  const product = products().find((p) => p.id === input.productId);
  if (!product) throw new Error("Product not found.");
  const option = product.durations.find((d) => d.days === input.durationDays);
  if (!option) throw new Error("Choose one of the available durations.");
  const targetingError = validateTargeting(product, input.targeting);
  if (targetingError) throw new Error(targetingError);
  if (!input.creative.headline.trim()) throw new Error("Add a headline.");
  if (product.needsImage && !input.creative.image) throw new Error("Upload a promotional image.");
  if (product.needsLogo && !input.creative.logo) throw new Error("Upload your logo.");
  if (input.requestedStart < daysFromToday(0)) throw new Error("The start date can't be in the past.");
  return { business, product, price: option.price };
}

/** Permission a reviewer needs for a campaign, by product family. */
export const reviewPermission = (p: AdProduct): Permission => (p.family === "sponsorship" ? "sponsorships.review" : "advertising.review");

export const adService = {
  // ---- Admin: products
  async createProduct(input: ProductInput, admin: Reviewer): Promise<AdProduct> {
    await delay(400);
    requireAdmin(admin, "create advertising products");
    const product: AdProduct = { ...input, id: newId("ap") };
    adProductStore.set([...products(), product]);
    return product;
  },

  async updateProduct(id: string, input: Partial<ProductInput>, admin: Reviewer): Promise<AdProduct> {
    await delay(400);
    requireAdmin(admin, "edit advertising products");
    const current = products().find((p) => p.id === id);
    if (!current) throw new Error("Product not found.");
    const next = { ...current, ...input };
    adProductStore.set(products().map((p) => (p.id === id ? next : p)));
    return next;
  },

  // ---- Admin: promotional credits
  async grantCredit(input: { businessId: string; amount: number; reason: string; expiresOn: string }, admin: Reviewer): Promise<PromoCredit> {
    await delay(400);
    requireAdmin(admin, "grant promotional credits");
    const business = businessStore.getSnapshot().find((b) => b.id === input.businessId);
    if (!business) throw new Error("Business not found.");
    if (input.amount <= 0) throw new Error("The credit must be greater than $0.");
    const credit: PromoCredit = {
      id: newId("pc"), businessId: business.id, businessName: business.name, amount: input.amount, remaining: input.amount,
      reason: input.reason.trim(), grantedOn: daysFromToday(0), expiresOn: input.expiresOn,
    };
    creditStore.set([credit, ...creditStore.getSnapshot()]);
    return credit;
  },

  async revokeCredit(id: string, admin: Reviewer): Promise<void> {
    await delay(300);
    requireAdmin(admin, "revoke promotional credits");
    creditStore.set(creditStore.getSnapshot().filter((c) => c.id !== id));
  },

  // ---- Owner: campaigns
  async submit(input: CampaignInput, requester: Requester): Promise<AdCampaign> {
    await delay(700);
    const { business, price } = validate(input, requester);
    const campaign: AdCampaign = {
      id: newId("cmp"), productId: input.productId, businessId: business.id, businessName: business.name, ownerId: requester.id,
      name: input.name.trim(), status: "pending_review", durationDays: input.durationDays, price, creditApplied: 0,
      paymentStatus: "unpaid", targeting: input.targeting, creative: input.creative, requestedStart: input.requestedStart,
      impressions: 0, clicks: 0, history: [{ at: nowISO(), by: requester.name, action: "submitted" }], createdAt: nowISO(), updatedAt: nowISO(),
    };
    campaignStore.set([campaign, ...campaigns()]);
    return campaign;
  },

  async resubmit(id: string, input: Omit<CampaignInput, "productId" | "businessId">, requester: Requester): Promise<AdCampaign> {
    await delay(700);
    const current = campaigns().find((c) => c.id === id);
    if (!current) throw new Error("Campaign not found.");
    if (current.ownerId !== requester.id) throw new Error("You can only edit your own campaigns.");
    if (current.status !== "changes_requested") throw new Error("Only campaigns with requested changes can be edited.");
    const { price } = validate({ ...input, productId: current.productId, businessId: current.businessId }, requester);
    return patchCampaign(id, {
      name: input.name.trim(), durationDays: input.durationDays, price, targeting: input.targeting, creative: input.creative,
      requestedStart: input.requestedStart, status: "pending_review", reviewNote: undefined,
      history: [...current.history, { at: nowISO(), by: requester.name, action: "resubmitted" }],
    });
  },

  // ---- Staff: review & schedule
  async review(id: string, decision: "approve" | "reject" | "request_changes", note: string, reviewer: Reviewer): Promise<AdCampaign> {
    await delay(600);
    const current = campaigns().find((c) => c.id === id);
    if (!current) throw new Error("Campaign not found.");
    const product = products().find((p) => p.id === current.productId);
    if (!product) throw new Error("Product not found.");
    requirePermission(reviewer, reviewPermission(product), product.family === "sponsorship" ? "review sponsorships" : "review advertising");
    if (current.status !== "pending_review") throw new Error("This campaign has already been reviewed.");
    if (decision !== "approve" && note.trim().length < 5) throw new Error("Add a short note so the advertiser knows what to do next.");
    const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "changes_requested";
    return patchCampaign(id, {
      status, reviewerName: reviewer.name, reviewNote: note.trim() || undefined,
      history: [...current.history, { at: nowISO(), by: reviewer.name, action: status, note: note.trim() || undefined }],
    });
  },

  /** Approved campaigns get a start date; the end date follows from the purchased duration. Inventory is checked. */
  async schedule(id: string, startDate: string, reviewer: Reviewer): Promise<AdCampaign> {
    await delay(500);
    const current = campaigns().find((c) => c.id === id);
    if (!current) throw new Error("Campaign not found.");
    const product = products().find((p) => p.id === current.productId);
    if (!product) throw new Error("Product not found.");
    requirePermission(reviewer, reviewPermission(product), "schedule campaigns");
    if (current.status !== "approved") throw new Error("Approve the campaign before scheduling it.");
    if (startDate < daysFromToday(0)) throw new Error("The start date can't be in the past.");
    const endDate = addDaysISO(startDate, current.durationDays);
    if (slotsUsedDuring(product, campaigns(), startDate, endDate, id) >= product.totalSlots) {
      throw new Error(`No ${product.name} slots are free for those dates. Pick another start date.`);
    }
    return patchCampaign(id, {
      status: "scheduled", startDate, endDate,
      history: [...current.history, { at: nowISO(), by: reviewer.name, action: "scheduled", note: `Starts ${startDate}` }],
    });
  },

  reset() {
    adProductStore.reset();
    campaignStore.reset();
    creditStore.reset();
  },
};
