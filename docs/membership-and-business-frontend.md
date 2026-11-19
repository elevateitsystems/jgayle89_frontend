# Membership, business management & advertising — frontend notes

Frontend-only. Everything below runs on mock data stored in the browser (`localStorage`, key prefix `sitrep:`, version in
`src/lib/demo-store.ts`). No Django code, models, migrations or endpoints were touched or invented.

## Architecture

| Layer | Where | Notes |
|---|---|---|
| Types | `src/types/{membership,business-ops,badges,advertising,member}.ts` (re-exported from `types/index.ts`) | One interface per entity. |
| Mock data | `src/lib/mock-data/*` | Plans & features, subscriptions/invoices, badges, edit requests, ad products/campaigns/credits, resources, ownership overlay, analytics generator. Base seeds stay in `src/data/*`. |
| Pure rules | `src/features/*/{access,rules,changes,nav}.ts` | No React/storage. Unit-tested (`npm test`). |
| Services | `src/services/*` | Async functions over `createCollectionStore`. **Swap bodies for DRF calls; signatures stay.** |
| Hooks | `src/features/*/hooks.ts`, `src/hooks/*` | Subscribe components to stores. Replace with query hooks if you add TanStack Query. |
| Schemas | `src/schemas/*` | Zod, shared by forms (and mirror these on the server). |
| UI | `src/components/{dashboard,membership,business,badges,sponsorship}` | Shells, tables, dialogs, forms. |

Redux Toolkit and TanStack Query are **not** in this project, so they were not introduced; the existing store/hook pattern was kept.

## Roles and navigation

* `UserRole` is still `admin | staff | user`. `UserType` is now `veteran | civilian | business_owner`.
* Admin + Staff → `/admin` (nav and route protection both come from `ADMIN_SECTIONS` in `lib/permissions.ts`; staff see only sections their permissions unlock).
* Veteran / Civilian / Business Owner → `/dashboard` (nav in `features/dashboard/nav.ts`; a member can only open pages in their own nav).
* Staff permissions are an admin-configurable list (`STAFF_PERMISSIONS`); adding one = add it there + a section that requires it.

## Routes added

Public: `/pricing`, `/resources` (plus updated `/`, `/directory`, `/directory/[slug]`, `/events`).
Dashboard: `/dashboard`, `membership`, `benefits`, `saved`, `financial`, `financial-education`, `career`, `community`, `appointments`, `settings`,
`businesses`, `businesses/[id]`, `memberships`, `edit-requests`, `badges`, `analytics`, `social-links`, `hiring`, `promotions`,
`advertising`, `sponsorships`, `campaigns/new`, `payments`.
Admin/Staff: `/admin/{edit-requests,verification,badges,benefits,plans,subscriptions,ad-products,campaigns,sponsorship-approvals,advertising-reviews,payments,reports}` (existing sections kept).

## Rules the UI enforces (the API must enforce them too)

* Owners never write to a listing. They submit an edit request; **only** `edits.review` staff approval applies it (`editRequestService.review`). Hiring status is the only direct owner change.
* Badges are created only by staff/admin (`badgeService.review|assign`). No plan, subscription or advertising purchase touches them.
* Plan limits (photos, links, promotions, saved items, appointments) are checked in the UI and re-checked in the services; the API must check them on every write.
* Essential features (directory search, community resources, public listing) cannot be switched off for any plan.
* Campaigns go live only when staff scheduled them **and** `paymentStatus` is `paid`/`credit`. Every public paid placement renders through `components/sponsorship/placements.tsx`, which always shows "Sponsored" / "Advertisement".

## Backend integration points

Each service below maps to a resource the API needs; the UI already passes the acting user.

* `membership-service` — plans CRUD, subscriptions (schedule downgrade, cancel/resume, admin assign), invoices (read-only).
* `edit-request-service` — submit, resubmit, review (approve applies changes server-side, atomically).
* `badge-service` — badge types, requests (with document upload), review, assign/revoke.
* `ad-service` — products, credits, campaigns (submit/resubmit/review/schedule incl. slot check).
* `business-service.setHiring`, `member-service` (saved businesses, appointments), `benefit-admin-service`, `resource-service`.
* File uploads (`AttachmentUploader`, `ImageUpload`) currently produce data URLs — upload the `File` and store the returned URL in the same field.
* Analytics (`lib/mock-data/analytics.ts`) is a deterministic generator returning `BusinessAnalytics`; replace with the analytics endpoint.
* Public placements: `features/advertising/rules.ts` (`pinSponsored`, `liveCampaigns`) decides placement client-side from the campaign list. Real targeting/ranking should be done at query time on the server.

### Stripe (placeholder only)

`services/payments-service.ts` → `createCheckoutSession()` currently returns `not_configured`; the checkout dialog says so and nothing is marked paid.
To connect: have the backend create a Checkout Session and return its URL, set `STRIPE_CONFIGURED = true`, redirect to it. `paymentStatus` / subscription status must be set only by the Stripe webhook, never by the frontend. Plan Stripe price ids are reserved in `MembershipPlan.stripe`.

## Demo accounts (sign-in page)

`admin@` · `staff@` (all operational permissions; not the admin-only structure permissions) · `veteran@` · `civilian@` · `owner@` (3 businesses on Pro / Free / Growth) — all `@sitrep.demo`, any 8+ character password.
Admin → Settings → **Reset demo data** restores all seed data.

## Known limitations

* Everything is per-browser; there are no real accounts, emails, notifications or file storage.
* Business Owner accounts can't self-register or claim a business yet (ownership is seeded).
* Included plan advertising allowances are configured and displayed but not redeemed (that needs billing).
* Promotional credits are shown and applied in the order summary but not consumed.
* ~~The public Benefits pages remain behind the phase flag~~ — switched on by the 2026-11 update (see below).
* Seed dates are relative to "today" in the browser, so campaign states shift as real time passes.

---

# Client update — November 2026 (frontend only)

Implements the client's "additional requests" letter. Still **frontend only, on mock data in `localStorage`**:
no API endpoints, models or migrations were created, and nothing below is connected to a backend. Storage version
was bumped to `v4` (`lib/demo-store.ts`) so browsers re-seed.

## What changed, by section of the letter

| § | Feature | Where |
|---|---|---|
| 1A | Military profile: branch (6), service status (5), Disabled / Combat / Purple Heart, start & end month/year with "best estimate", city/state/ZIP | `types/profile.ts`, `features/profile/profile.ts` (rules, tested), `components/auth/user-type-fields.tsx` (registration + profile settings) |
| 1B | "I am a First Responder" + category, shown as a badge (no separate tier) | same; `components/account/member-identity.tsx` |
| 2A | Public Benefits Directory (flag on): state, **military background**, category, federal/state filters; eligibility + availability on cards; staff add / edit / categorise / end date / activate / remove; veteran dashboard "Benefits Available in Your State"; plan-gated **Schedule an Appointment for Assistance** | `data/benefits.ts` (+ verified-URL federal family/other programs), `lib/benefit-filters.ts`, `services/benefit-admin-service.ts`, `features/benefits/hooks.ts`, `components/membership/assistance-button.tsx` |
| 2B | Freebies & Discounts: homepage section, public `/freebies` (search, categories, countdown, expiry hidden), staff `/admin/freebies` | `features/offers/rules.ts`, `services/offer-service.ts`, `lib/mock-data/offers.ts` (fictional companies, `.example` links) |
| 3 | Near Me (`/dashboard/near-me`): current location (falls back to ZIP when denied), ZIP, 10/25 mi, map + list with distance, category and link | `features/near-me/rules.ts`, `lib/mock-data/organizations.ts` (sample VFW/Legion/nonprofits + demo ZIP table), two sample *veteran-friendly* businesses |
| 4A | Photos & videos by tier: Free = logo only; Growth/Pro/Executive add cover, gallery, videos. Limits are plan features (`cover_image`, `business_photos`, `business_videos`) editable in Admin → Membership Plans. Staff upload in the business form and Photos; owners submit via `/dashboard/media` (edit request) | `features/business/media.ts` |
| 4B | Staff edit social links; TikTok and X added | `components/admin/listing-extras-editor.tsx`, `schemas/edit-request.ts` |
| 4C | Business offers with approval workflow: Pending / Approved / Published / Rejected (+ Deactivated, Expired), admin-configurable rule per origin (staff / owner / both), owner "request to speak with staff", internal staff notes, public countdown | `features/offers/rules.ts`, `services/offer-service.ts`, `/admin/business-offers`, owner `/dashboard/promotions`, settings |
| 5 | Badges: on/off per assignment, remove, create/edit types (grantable), **"Verified Business" auto-awarded to paid business plans** (derived, configurable per badge type); all other verification badges still need review | `features/badges/rules.ts` + `hooks.ts`, `components/badges/badges-admin.tsx` |
| 6 | Services marketplace: member `/dashboard/services` and business `/dashboard/business-services` (Free included), Coming Soon, eligible tiers, promotions (% off, $ off, months free, free consultation, member price, coupon codes) scoped by tier/service/period, staff *request* discounts without `services.discounts`, every purchase creates an order (Pending / Scheduled / In Progress / Completed) | `features/services/pricing.ts`, `services/marketplace-service.ts`, `/admin/services`, `/admin/service-orders` |
| 7A | Business analytics only on **Pro** and **Executive** (plan features); admins see any business at `/admin/business-analytics` | `lib/mock-data/membership.ts`, `components/admin/business-analytics-admin.tsx` |
| 7B | Admin reports: listings added/updated per employee (today / week / month / year / custom), appointment metrics by status, type, employee and period, with drill-down links | `features/analytics/rules.ts`, `components/admin/operations-reports.tsx`, `/admin/appointments` |
| 8 | Clickable business and member names across admin tables → management page or new member page `/admin/users/[id]` | `components/admin/entity-links.tsx`, `components/admin/member-detail-admin.tsx` |
| 9 | Public registration on/off (Admin → Settings): hides sign-up buttons, blocks the form and the service; sign-in unaffected | `services/settings-service.ts`, `components/auth/registration-gate.tsx` |
| 11 | Categories & subcategories: primary + extra categories and subcategories per business, filters, create / rename / move / reorder / activate / show-in-filters, duplicate prevention, change history; owners pick existing ones via edit request | `features/categories/rules.ts`, `services/category-service.ts`, `components/admin/categories-manager.tsx` |
| 11D | New grantable staff permissions — admin-only until granted: `categories.manage`, `subcategories.manage`, `badge_types.manage`; plus `offers.manage`, `services.manage`, `services.discounts`, `appointments.manage` | `lib/permissions.ts` |
| 11E | Back-office audit log (who/what/when) for categories, badges, offers, benefits, services, settings, listings, appointments; `/admin/activity` | `services/audit-service.ts` |

## Backend integration points added

* `audit-service` → write audit rows server-side in the same transaction as each change.
* `offer-service` (freebies + business offers) — approvals must be re-checked server-side against the settings rule and ownership.
* `marketplace-service` — catalogue, promotions (approval), orders. **Checkout:** `purchase()` records the order then calls
  `createCheckoutSession({ kind: "service" })`, which still returns `not_configured`; orders stay **Awaiting payment** until a
  Stripe webhook marks them paid. Totals must be recomputed server-side (`features/services/pricing.ts` mirrors the rules).
* `member-service.appointmentAdminService` — assignment and status for staff.
* Near Me needs a **geocoding / ZIP service**; `lib/mock-data/organizations.ts#zipCentroids` is a small demo table.
* Real veteran-organization listings (VFW, American Legion, nonprofits) must come from verified sources — the seed entries are fictional samples.
* Business analytics remain generated sample data (`lib/mock-data/analytics.ts`).

## Interpretations worth confirming with the client

* **Media tiers apply to business memberships** (listings with an owner account). Staff-maintained listings without an owner keep their existing cover image; otherwise most of the directory would lose its photos.
* **"Verified Business" for paid plans** is derived from the plan (no assignment record) so it disappears automatically if a plan lapses. Free listings can still earn it through review.
* Editing a live business offer sends the new version for approval again; the old version stops showing in the meantime.
* Benefit summaries are prototype text linked to official sources and labelled "Sample summary" until staff mark them verified.
