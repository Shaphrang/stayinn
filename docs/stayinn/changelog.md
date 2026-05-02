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
