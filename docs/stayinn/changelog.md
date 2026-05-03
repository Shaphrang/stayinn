# Changelog

## 2026-05-02

### Files created
- `src/app/admin/(panel)/owners/actions.ts`

### Files modified
- `src/app/admin/(panel)/owners/page.tsx`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/env.ts`
- `docs/stayinn/admin-crud-implementation.md`
- `docs/stayinn/admin-testing-checklist.md`
- `docs/stayinn/changelog.md`

### Features added
- Admin owner CRUD server actions with platform-admin access guard checks.
- Owner list filtering and inline owner update/status/delete actions.
- Supabase REST write helpers (`insert`, `patch`, `delete`) for admin server actions.

### Known limitations
- CRUD modules for properties, rooms, bookings, locations, and settings are not implemented yet.
- Owner page currently uses inline forms and basic table UX; modal-based UX pending.

### Next steps
- Implement properties CRUD with image upload and dependent location filters.
- Implement rooms CRUD with amenity/type masters.
- Implement bookings, payments, charges, and invoice actions.
- Implement locations/settings CRUD with reusable admin components.

## 2026-05-03

### Files created
- `src/types/public.ts`
- `src/lib/public/constants.ts`
- `src/lib/public/mappers.ts`
- `src/lib/public/home.ts`
- `src/lib/public/properties.ts`
- `src/lib/public/filters.ts`
- `src/lib/public/search.ts`
- `src/lib/public/events.ts`
- `src/app/api/v1/public/home/route.ts`
- `src/app/api/v1/public/properties/route.ts`
- `src/app/api/v1/public/properties/[slug]/route.ts`
- `src/app/api/v1/public/filters/route.ts`
- `src/app/api/v1/public/search/route.ts`
- `src/app/api/v1/public/events/route.ts`
- `docs/sql/migrations/2026-05-03-public-api-foundation.sql`

### Files modified
- `docs/stayinn/changelog.md`

### Features added
- Added versioned public API foundation (`/api/v1/public/*`) with consistent success/error contracts.
- Added reusable public service layer for home, properties, filters, search, and events.
- Added mapper layer for camelCase API models and storage-path image URL normalization.
- Added SQL migration for `home_banners`, `v_public_home_banners`, and `public_events`.

### Known limitations
- Search endpoint validates dates but does not perform live availability checks in this phase.
- Location free-text (`where`) is normalized to slug for first-pass matching.

### Testing steps
- Run `npm run lint`.
- Start app and call:
  - `GET /api/v1/public/home`
  - `GET /api/v1/public/properties?page=1&pageSize=10`
  - `GET /api/v1/public/properties/{slug}`
  - `GET /api/v1/public/filters`
  - `GET /api/v1/public/search?q=homestay`
  - `POST /api/v1/public/events`

### Next recommended steps
- Wire these services directly into the PWA homepage/listing UI.
- Add RPC-backed real availability search when booking-availability rules are finalized.
- Add rate-limiting and abuse controls on `POST /api/v1/public/events`.
