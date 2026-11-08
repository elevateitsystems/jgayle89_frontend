# Mission: SITREP — Phase 1 Frontend

Frontend-only prototype of the Mission: SITREP veteran community directory.
**No backend, database, real auth or payments.** All data is fictional sample data kept in
`src/data` and persisted to `localStorage` so add / edit / delete demos survive reloads.

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production check
npm run lint
npm test           # node:test unit + data-integrity tests (no extra dependencies)
```

Requires Node 20+.

## Brand assets

- `public/logo.png` — the official logo (supplied artwork, trimmed of its empty transparent border and resized for the web). Rendered untouched by `src/components/brand/logo.tsx`; always place it on a light surface.
- `public/logo-original.png` — the untouched original file.
- `src/app/icon.png`, `src/app/apple-icon.png` — favicons cropped from the logo's crosshair-pin emblem.
- Palette tokens live in `src/app/globals.css` (olive + sand scales).

## Routes

| Public | Admin (demo, unguarded) |
| --- | --- |
| `/` Home | `/admin` Dashboard |
| `/directory` Search, filters, grid/list/map | `/admin/businesses` Table, search, status, delete |
| `/directory/[slug]` Business details | `/admin/businesses/new` · `/admin/businesses/[id]/edit` |
| `/events` · `/events/[slug]` | `/admin/events` Table + slide-over form |
| `/benefits` · `/benefits/[slug]` Veteran benefits search | `/admin/import` CSV import |
| `/login` · `/register` | `/admin/settings` Site settings (Google ratings toggle) |

## Structure

```
src/
  app/            routes — (site) public layout, (auth), admin
  components/     ui (shadcn) · layout · brand · shared · home · directory · events · auth · admin
  config/         site config (name, nav, logo path)
  data/           demo data: businesses, events, categories, dashboard, sample images
  hooks/          React hooks over the stores (use-businesses, use-events, use-session, …)
  lib/            utils, demo-store (localStorage), filters, csv parser, dates, slugs
  schemas/        Zod schemas (business, event, auth)
  services/       data-access layer (async) — the API integration seam
  types/          shared TypeScript types
```

## Preparing for the Django REST API

UI components never touch `localStorage`. They call hooks (`src/hooks`) which read from stores, and
mutate through services (`src/services/*-service.ts`) whose methods are already `async` and return plain
objects. To integrate the API: re-implement the service bodies with `fetch`, and swap the hooks' data source
for your fetching layer (SWR / React Query). Zod schemas can be reused for request validation.

## Demo-only behaviours

- Sign-in accepts any valid email + 8-char password (`fail@…` shows the error state; `taken@…` on register).
- Event registration, forgot-password and CSV import act on local state only.
- To restore the original samples, clear this site's localStorage (keys starting with `sitrep:`) and reload.
- Ratings/reviews are labelled as demo data throughout.

## Credits

Photography via Unsplash (free license), self-hosted in `public/images`. Map tiles © OpenStreetMap contributors.

## Ratings (demo)

Each business profile shows two separate ratings: the **website rating** (`Business.rating` / `reviewCount`, plus
sample reviews in `src/data/reviews.ts`) and a **Google rating**. Google values are static mock data
(`src/data/google-ratings.ts`) served through `GoogleRatingProvider` in `src/services/google-rating-service.ts` — swap
that provider for a Places API-backed one (server-side route, server-only API key) to go live. Admins can hide the
Google rating from `/admin/settings`.

## Veteran benefits

`/benefits` searches `src/data/benefits.ts` by keyword, state (all 50 states + DC supported in `src/data/us-states.ts`)
and category. Federal programs (`state: null`) appear for every state. Every record is `dataStatus: "demo"` — links go to
official sources but the summaries are **not yet reviewed against them**; the UI labels them "Sample summary". Only set
`"verified"` (with `lastVerified`) after a person has checked the record against `sourceUrl`.
