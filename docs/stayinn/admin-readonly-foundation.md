# StayInn Admin Read-only Foundation

## Admin login flow
- Route: `/admin/login`
- Uses Supabase Auth password grant with email/password.
- After auth, checks `public.profiles` for `role=platform_admin` and `is_active=true`.
- Invalid role/status users are logged out and shown clear error.

## Route protection
- All admin panel pages under `/admin/(panel)/*` use server-side guard.
- Guard validates token + Supabase user + profile role/status.
- Non-authenticated or non-admin users are redirected to `/admin/login`.

## Pages created
- `/admin/dashboard`
- `/admin/owners`
- `/admin/properties`
- `/admin/rooms`
- `/admin/bookings`
- `/admin/locations`
- `/admin/settings`

## Data displayed
- Dashboard: summary counts and collected paid amount from `booking_payments`.
- Owners: `owner_profiles` joined with `profiles`.
- Properties: `properties` joined with `owner_profiles`, `states`, `districts`, `locations`.
- Rooms: `property_rooms` joined with `properties`.
- Bookings: `bookings` joined with `booking_guests`, `properties`, `property_rooms`, `owner_profiles`.
- Locations: states, districts, locations in read-only sections.
- Settings: `platform_settings` rows.

## Demo login
- Email: `demo.admin@stayinn.test`
- Password: `StayInn@123`

## Known limitations
- Read-only foundation only; no CRUD/actions implemented.
- Data rendering is currently simple table/pre style for rapid validation.
- Supabase calls use REST endpoints and require env vars configured.

- Auth now uses a lightweight admin session cookie (`admin_session`) with role checks; no access/refresh token cookie management.
