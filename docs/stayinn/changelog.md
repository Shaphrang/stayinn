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

## 2026-05-03 (PWA homepage UI)

### Files created
- `src/app/manifest.ts`
- `src/components/public/home/types.ts`
- `src/components/public/home/MobileHomePage.tsx`
- `src/components/public/home/HomeHeader.tsx`
- `src/components/public/home/HeroSection.tsx`
- `src/components/public/home/HeroSearchCard.tsx`
- `src/components/public/home/CategoryChips.tsx`
- `src/components/public/home/CategoryGrid.tsx`
- `src/components/public/home/PromoBannerCarousel.tsx`
- `src/components/public/home/StaySection.tsx`
- `src/components/public/home/StayCard.tsx`
- `src/components/public/home/CompactStayCard.tsx`
- `src/components/public/home/BottomNav.tsx`
- `src/components/public/home/HomeEmptyState.tsx`
- `public/icons/icon-192.svg`
- `public/icons/icon-512.svg`

### Files modified
- `src/app/page.tsx`
- `src/app/layout.tsx`
- `docs/stayinn/changelog.md`

### Features added
- Replaced placeholder root page with mobile-first PWA homepage shell that uses `getPublicHomeData()` directly.
- Added hero, floating search card, category chips/grid, promo banners, featured/weekend/nearby horizontal stay sections, and fixed bottom navigation.
- Added graceful fallback empty state and per-section fallback data handling when arrays are empty.
- Added web app manifest and basic standalone/mobile metadata with safe-area-friendly bottom navigation layout.

### Known limitations
- Analytics event tracking for homepage interactions is intentionally not wired in this pass.
- PWA icons are SVG placeholders; dedicated branded PNG icons can be added later.
- `/stays` and other bottom-nav destination pages may not exist yet; links are prepared for upcoming tasks.

### Testing steps
- Run `npm run lint`.
- Run `npm run build`.

### Next recommended steps
- Add lightweight client-side event tracking via existing public events service.
- Improve category artwork and property image source curation for production polish.
- Implement `/stays` listing page to complete link flow from homepage search/chips/sections.

## 2026-05-03 (admin media upload hardening)

### Files created
- `src/lib/media/storage-paths.ts`
- `src/lib/media/image-optimizer.ts`
- `src/components/admin/media/ImageUploadField.tsx`
- `src/components/admin/media/GalleryUploadField.tsx`

### Files modified
- `src/components/admin/property-form.tsx`
- `src/app/admin/(panel)/properties/actions.ts`
- `src/components/admin/room-form.tsx`
- `src/app/admin/(panel)/rooms/actions.ts`
- `src/app/admin/(panel)/rooms/[id]/edit/page.tsx`
- `docs/stayinn/changelog.md`

### Features added
- Added reusable storage-path utilities to generate sanitized `stayinn-media` paths with `slug + short-id` folder patterns.
- Added client-side WebP optimization utility with resize + quality stepping toward ~200-300KB target and 500KB fallback guardrail.
- Integrated optimized cover/gallery upload flow into admin property and room forms with preview/remove behavior and submit disable while uploading.
- Updated room CRUD actions/schema to persist `cover_image` and `gallery_images` paths.

### Known limitations
- Build currently fails in this environment due to Google Fonts fetch errors from `next/font` (external network path).
- Existing property create/update actions still keep legacy file-upload support for backward compatibility.

### Testing steps
- Run `npm run build`.

### Next recommended steps
- Add optional safe storage-object cleanup worker for unreferenced media paths.
- Add consistent media widgets usage across any future admin forms containing `image_path` fields.
