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

`admin@` · `staff@` (all permissions) · `veteran@` · `civilian@` · `owner@` (3 businesses on Pro / Free / Growth) — all `@sitrep.demo`, any 8+ character password.
Admin → Settings → **Reset demo data** restores all seed data.

## Known limitations

* Everything is per-browser; there are no real accounts, emails, notifications or file storage.
* Business Owner accounts can't self-register or claim a business yet (ownership is seeded).
* Included plan advertising allowances are configured and displayed but not redeemed (that needs billing).
* Promotional credits are shown and applied in the order summary but not consumed.
* The public Benefits pages remain behind the existing phase flag (`siteConfig.features.benefits`); members see the catalogue in their dashboard.
* Seed dates are relative to "today" in the browser, so campaign states shift as real time passes.
