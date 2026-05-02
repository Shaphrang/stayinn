# AGENTS.md — StayInn Project

## Project Name

**StayInn**

## Project Type

StayInn is a **Next.js + Supabase + Tailwind CSS + TypeScript** accommodation platform MVP.

It is a simple multi-owner stay-booking platform for:

* Homestays
* Resorts
* Guest houses
* Hotels
* Cottages
* Villas
* Apartments
* Camping/tent stays
* Other local accommodations

The project is inspired by platforms like OYO/Airbnb, but the first version must remain **simple, fast, secure, and production-ready**.

---

# Core MVP Concept

StayInn MVP has only two logged-in roles:

1. **Platform Admin**
2. **Property Owner**

There is **no customer/guest login** for now.

Guests can browse public listings and send booking requests without creating an account.

The MVP flow is:

```text
Platform Admin
  -> manages platform
  -> approves owners
  -> approves properties
  -> views all records

Owner
  -> manages own profile
  -> adds properties
  -> adds rooms/cottages
  -> manages own bookings
  -> records payments/charges

Public Guest
  -> browses stays
  -> submits booking request
  -> no login required
```

---

# Tech Stack

Use the existing project stack:

```text
Next.js App Router
TypeScript
Tailwind CSS
Supabase Auth
Supabase PostgreSQL
Supabase Storage
Vercel deployment
```

Preferred libraries when needed:

```text
@supabase/supabase-js
@supabase/ssr
zod
react-hook-form
lucide-react
sonner
```

Do not add unnecessary heavy dependencies.

---

# Important Development Style

Always build with these principles:

```text
simple
secure
production-ready
mobile responsive
clean UI
clear validation
no over-complication
well documented
safe for future expansion
```

Avoid unnecessary abstraction.

Prefer straightforward readable code over clever code.

Do not break existing functionality.

---

# Existing Backend Schema

The Supabase backend already has these main tables:

```text
profiles
owner_profiles
states
districts
locations
properties
property_rooms
booking_guests
bookings
booking_status_history
booking_payments
booking_charges
invoices
platform_settings
booking_code_counters
```

Existing important views/functions:

```text
v_public_properties
v_public_property_rooms
v_owner_booking_details
create_booking_request(...)
is_platform_admin()
current_owner_profile_id()
current_approved_owner_profile_id()
generate_booking_code()
recalculate_booking_financials(...)
```

Storage bucket:

```text
stayinn-media
```

---

# Critical MVP Rules

Follow these rules strictly:

## 1. No customer login

Do not create guest/customer login, customer dashboard, customer profile, or guest account system for now.

Guests only submit booking requests publicly.

## 2. Only admin and owner dashboards

The logged-in areas are:

```text
/admin/*
/owner/*
```

## 3. One booking = one room/cottage

Do not create multi-room booking logic for now.

Do not create a `booking_units` table.

## 4. No inventory-count logic

Do not create logic like:

```text
5 Deluxe Rooms available
10 Standard Rooms available
```

For MVP, every bookable room/cottage must be a separate row in `property_rooms`.

Example:

```text
Deluxe Room 1
Deluxe Room 2
Deluxe Room 3
```

## 5. Prices stay in `property_rooms`

Do not create a separate pricing table for now.

Use existing price columns:

```text
weekday_rate
weekend_rate
season_rate
holiday_rate
child_rate
extra_bed_rate
```

## 6. Amenities are text arrays

Do not create amenities tables.

Amenities are stored as `text[]` in:

```text
properties.amenities
property_rooms.amenities
```

Amenity options come from `platform_settings`, for example:

```text
property_amenities_master
room_amenities_master
room_type_master
```

## 7. Images are stored directly on property/room tables

Do not create a `property_media` table.

Use:

```text
properties.cover_image
properties.gallery_images
property_rooms.cover_image
property_rooms.gallery_images
```

Only store storage paths in the database, not full public URLs.

## 8. Location master data is required

Use separate master tables:

```text
states
districts
locations
```

Location relationship:

```text
State -> District -> Location
```

## 9. Ads module later

Do not create ads, sponsored placements, promotions, or subscription logic yet.

For now, use only:

```text
properties.is_featured
properties.is_verified
```

---

# Route Structure

## Admin Routes

```text
/admin/login
/admin/dashboard
/admin/owners
/admin/properties
/admin/rooms
/admin/bookings
/admin/locations
/admin/settings
/admin/reports
```

## Owner Routes

```text
/owner/login
/owner/dashboard
/owner/profile
/owner/properties
/owner/properties/new
/owner/properties/[id]/edit
/owner/properties/[id]/rooms
/owner/bookings
/owner/bookings/[id]
/owner/billing
/owner/reports
```

## Public Routes

Suggested public routes:

```text
/
/stays
/stays/[slug]
/locations/[slug]
/book/[roomId]
/owners/register
```

Do not create unnecessary routes without a clear requirement.

---

# Authentication Rules

Use Supabase Auth.

Authentication should check `profiles` after login.

## Platform Admin Access

Admin access requires:

```text
profiles.role = 'platform_admin'
profiles.is_active = true
```

Only platform admins can access:

```text
/admin/*
```

Owners must never access `/admin/*`.

## Owner Access

Owner access requires:

```text
profiles.role = 'owner'
profiles.is_active = true
```

Owner dashboard behavior depends on `owner_profiles.status`:

```text
pending    -> show waiting approval page
approved   -> allow owner dashboard
rejected   -> show rejected message
suspended  -> show suspended message
```

Owners must only access their own records.

---

# Access Control Requirements

Do not rely only on hidden frontend buttons.

Every server action/API route must check access.

## Admin server actions must check:

```text
current user exists
profile exists
role = platform_admin
is_active = true
```

## Owner server actions must check:

```text
current user exists
profile exists
role = owner
is_active = true
owner_profiles.profile_id = auth.uid()
record belongs to current owner
```

Do not let owners update platform-controlled fields.

Owners must not edit:

```text
owner_profiles.status
owner_profiles.approved_at
owner_profiles.approved_by
owner_profiles.rejected_at
owner_profiles.rejected_by
owner_profiles.suspended_at
owner_profiles.suspended_by
owner_profiles.remarks
```

Owners must not edit these property fields:

```text
properties.is_featured
properties.is_verified
properties.rating_average
properties.rating_count
properties.approved_at
properties.approved_by
properties.rejected_at
properties.rejected_by
properties.suspended_at
properties.suspended_by
```

---

# Admin Panel Requirements

## Admin Login

Create or maintain:

```text
/admin/login
```

Login flow:

```text
email/password login through Supabase Auth
check profiles.role
check profiles.is_active
redirect valid admin to /admin/dashboard
show error and sign out invalid user
```

## Admin Layout

Admin pages should use:

```text
left sidebar
top header
logout button
active menu highlight
mobile responsive drawer/sidebar
```

Sidebar menu:

```text
Dashboard
Owners
Properties
Rooms
Bookings
Locations
Settings
Reports
```

## Admin Read-Only Foundation

Before CRUD, admin pages may first retrieve/display data only.

Read-only pages:

```text
/admin/dashboard
/admin/owners
/admin/properties
/admin/rooms
/admin/bookings
/admin/locations
/admin/settings
```

## Later Admin CRUD

When CRUD is requested, build it carefully for:

```text
owner approval/rejection/suspension
property approval/rejection/suspension
location master management
platform settings
booking status management
billing/payment/charges
invoice printing
reports/export
```

Do not add CRUD until explicitly requested if the current task asks only for retrieval.

---

# Owner Panel Requirements

Do not build owner panel unless requested.

When requested, owner dashboard should include:

```text
owner dashboard
owner profile
property CRUD
room CRUD
booking management
billing
reports
```

Owner must only see data scoped to their own `owner_profiles.id`.

---

# UI Design Direction

StayInn should look like a modern, polished accommodation platform admin.

Use:

```text
deep teal / indigo sidebar
white cards
soft shadows
rounded corners
subtle gradients
clean tables
status badges
responsive cards
clear spacing
professional dashboard design
```

The UI should be:

```text
modern
user-friendly
clean
premium but simple
mobile responsive
fast to scan
```

Avoid plain/basic UI.

Avoid cluttered UI.

---

# Reusable Components

Create reusable components where useful:

```text
DashboardShell
AdminSidebar
OwnerSidebar
Topbar
StatCard
DataTable
StatusBadge
OwnerStatusBadge
PropertyStatusBadge
BookingStatusBadge
PaymentStatusBadge
EmptyState
LoadingState
ConfirmDialog
FormSection
SearchInput
FilterBar
DateRangeFilter
SubmitButton
ImageUploadField
GalleryUploadField
```

Keep components simple and maintainable.

---

# Status Badge Colors

Use consistent badges.

## Owner Status

```text
pending    -> amber
approved   -> green
rejected   -> red
suspended  -> slate/dark
```

## Property Status

```text
draft           -> slate
pending_review  -> amber
active          -> green
inactive        -> gray
rejected        -> red
suspended       -> dark
```

## Room Status

```text
active       -> green
inactive     -> gray
maintenance  -> amber
```

## Booking Status

```text
pending    -> amber
confirmed  -> blue/green
cancelled  -> red
completed  -> green
rejected   -> red
no_show    -> purple/slate
```

## Payment Status

```text
unpaid          -> red
partially_paid  -> amber
paid            -> green
waived          -> blue
refunded        -> purple
```

---

# Data Formatting

Use clear formatting:

```text
currency -> ₹ by default unless platform_settings says otherwise
dates -> readable format like 02 May 2026
phone -> readable but preserve database value
status -> badge
booleans -> Yes/No badges
images -> use fallback image when missing
```

---

# Image Upload Rules

Use Supabase Storage bucket:

```text
stayinn-media
```

Store paths like:

```text
properties/{property_id}/cover/{filename}.webp
properties/{property_id}/gallery/{filename}.webp
properties/{property_id}/rooms/{room_id}/cover/{filename}.webp
properties/{property_id}/rooms/{room_id}/gallery/{filename}.webp
```

Database stores only paths:

```text
cover_image
gallery_images
```

Create helper to convert storage path to public URL.

Validate image type and file size.

Optimize images when possible.

Target image size:

```text
200 KB to 300 KB where possible
```

---

# Validation Rules

Use Zod or simple validation helpers.

Important validations:

```text
required fields must show clear messages
phone should be 10 to 15 digits for owners/properties
booking guest phone should be exactly 10 digits
rates cannot be negative
check-out date must be after check-in date
max_adults >= 1
max_children >= 0
max_guests >= max_adults
slug should be lowercase URL-friendly
state/district/location are required for properties
```

Do not show raw database errors to normal users.

Show user-friendly messages.

---

# Booking Rules

One booking is linked directly to:

```text
bookings.property_id
bookings.room_id
bookings.guest_id
bookings.owner_id
```

Do not use `booking_units`.

Do not create multi-room booking yet.

Booking statuses:

```text
pending
confirmed
cancelled
completed
rejected
no_show
```

Payment statuses:

```text
unpaid
partially_paid
paid
waived
refunded
```

Payment methods:

```text
pay_on_arrival
cash
upi
bank_transfer
online
other
```

For MVP, default booking payment method is:

```text
pay_on_arrival
```

---

# Billing Rules

Use existing tables:

```text
booking_payments
booking_charges
invoices
```

Charges can include:

```text
extra_charge
discount
food
extra_bed
late_checkout
damage
pickup_drop
service_charge
other
```

Database already has:

```text
recalculate_booking_financials(booking_id)
```

After adding payments or charges, re-fetch updated booking/invoice data.

Do not create online payment gateway integration yet.

Do not create payout/commission logic yet.

---

# Reports

When reports are requested, create simple reports first:

```text
bookings report
revenue/collections report
properties report
owners report
check-in/check-out report
```

Reports should support:

```text
date filters
status filters
summary cards
CSV export
```

CSV export can be frontend-generated for MVP.

---

# Documentation Requirements

Always update documentation for meaningful work.

Use docs folder:

```text
docs/stayinn/
```

Important docs:

```text
docs/stayinn/admin-readonly-foundation.md
docs/stayinn/admin-crud-implementation.md
docs/stayinn/supabase-schema-usage.md
docs/stayinn/storage-bucket-guide.md
docs/stayinn/role-access-control.md
docs/stayinn/admin-testing-checklist.md
docs/stayinn/changelog.md
```

For every major change, update:

```text
docs/stayinn/changelog.md
```

Include:

```text
files created
files modified
features added
known limitations
testing steps
next recommended steps
```

---

# Testing Requirements

When implementing admin/owner work, test with demo users if available.

Demo admin:

```text
demo.admin@stayinn.test
StayInn@123
```

Demo owners:

```text
demo.owner1@stayinn.test
demo.owner2@stayinn.test
demo.owner3@stayinn.test
demo.owner4@stayinn.test
demo.owner5@stayinn.test
StayInn@123
```

Do not hardcode these users in the app.

Use them only for testing.

---

# Error Handling Requirements

Use clear user-friendly errors.

Examples:

```text
You are not authorized to access this page.
Your owner account is pending approval.
Your owner account has been suspended.
Property not found or you do not have access.
Booking not found or you do not have access.
Payment amount must be greater than zero.
Image upload failed. Please try again.
```

Log detailed errors only in development/server logs.

---

# Loading and Empty States

Every data page should have:

```text
loading state
empty state
error state
```

Examples:

```text
No owners found.
No properties found.
No rooms found.
No bookings found.
No settings found.
No locations found.
```

---

# Mobile Responsiveness

All admin/owner pages should work on:

```text
desktop
tablet
mobile
```

Mobile behavior:

```text
sidebar collapses into drawer
cards stack vertically
tables scroll horizontally or become card lists
buttons are easy to tap
content spacing remains clean
```

---

# Code Quality Rules

Use TypeScript properly.

Avoid `any` unless absolutely necessary.

Use shared types where possible.

Create clear helpers for:

```text
Supabase clients
auth checks
role checks
formatting
slug generation
storage URL generation
CSV export
status badge mapping
```

Suggested helper locations:

```text
src/lib/supabase/
src/lib/auth/
src/lib/storage/
src/lib/utils/
src/lib/validations/
src/types/
```

---

# Supabase Client Rules

Use browser client only in client components.

Use server client in server actions/server components.

Never expose service role key to the browser.

If service role is used, keep it server-only.

---

# Do Not Do

Do not:

```text
create customer login
create booking_units
create property_media
create amenities tables
create inventory count logic
create online payment gateway
create owner payout system
create ads module unless requested
create unnecessary complex abstractions
hardcode demo users
expose service role key in client code
skip role checks
skip docs
change database schema unless explicitly requested
```

---

# Current Recommended Development Order

## Phase 1: Admin read-only foundation

```text
admin login
admin route protection
admin layout/sidebar/topbar
dashboard read-only stats
owners read-only page
properties read-only page
rooms read-only page
bookings read-only page
locations read-only page
settings read-only page
docs
```

## Phase 2: Admin CRUD

```text
owner approval
property approval
location CRUD
settings CRUD
booking status management
```

## Phase 3: Owner dashboard

```text
owner login
owner route protection
owner dashboard
owner profile
owner property CRUD
owner room CRUD
```

## Phase 4: Booking and billing

```text
booking detail pages
status timeline
record payment
add charges/discounts
invoice print
CSV exports
```

## Phase 5: Public platform

```text
homepage
stay listing
property detail
room detail
booking request form
location pages
SEO
```

---

# Final Instruction for Agents

When working on StayInn, always follow the existing Supabase schema and MVP simplification decisions.

Do not make it more complex than requested.

Build one clear step at a time.

Always document what you changed.

Always preserve the ability to enhance the platform later without rebuilding from scratch.
