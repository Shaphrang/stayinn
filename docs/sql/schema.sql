/* ============================================================
   STAYINN MVP BACKEND SCHEMA
   Supabase PostgreSQL
   Version: 1.0.0

   Concept:
   - No customer login for MVP
   - Only platform_admin and owner login
   - One booking = one property room/cottage
   - No inventory count
   - No booking_units table
   - No property_media table
   - Amenities stored as text[] selected from frontend master data
   - Property and room images stored as cover_image + gallery_images
   - State, district, location as master data
   ============================================================ */

BEGIN;

/* ============================================================
   1. EXTENSIONS
   ============================================================ */

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;


/* ============================================================
   2. ENUMS
   ============================================================ */

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM (
      'platform_admin',
      'owner'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'owner_status') THEN
    CREATE TYPE public.owner_status AS ENUM (
      'pending',
      'approved',
      'rejected',
      'suspended'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
    CREATE TYPE public.property_type AS ENUM (
      'homestay',
      'resort',
      'guest_house',
      'hotel',
      'cottage',
      'villa',
      'apartment',
      'camping',
      'other'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
    CREATE TYPE public.property_status AS ENUM (
      'draft',
      'pending_review',
      'active',
      'inactive',
      'rejected',
      'suspended'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_status') THEN
    CREATE TYPE public.room_status AS ENUM (
      'active',
      'inactive',
      'maintenance'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status') THEN
    CREATE TYPE public.booking_status AS ENUM (
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'rejected',
      'no_show'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM (
      'pay_on_arrival',
      'cash',
      'upi',
      'bank_transfer',
      'online',
      'other'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM (
      'unpaid',
      'partially_paid',
      'paid',
      'waived',
      'refunded'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'charge_type') THEN
    CREATE TYPE public.charge_type AS ENUM (
      'extra_charge',
      'discount',
      'food',
      'extra_bed',
      'late_checkout',
      'damage',
      'pickup_drop',
      'service_charge',
      'other'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE public.invoice_status AS ENUM (
      'draft',
      'issued',
      'paid',
      'cancelled'
    );
  END IF;
END $$;


/* ============================================================
   3. COMMON FUNCTIONS
   ============================================================ */

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


/* ============================================================
   4. CORE USER TABLES
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  full_name text NOT NULL DEFAULT '',
  email citext UNIQUE,
  phone text,

  role public.user_role NOT NULL DEFAULT 'owner',
  avatar_url text,

  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT profiles_phone_check
    CHECK (phone IS NULL OR phone ~ '^[0-9]{10,15}$')
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE IF NOT EXISTS public.owner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,

  business_name text NOT NULL,
  contact_person text,
  phone text NOT NULL,
  email citext,
  address text,

  status public.owner_status NOT NULL DEFAULT 'pending',
  remarks text,

  approved_at timestamptz,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  rejected_at timestamptz,
  rejected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  suspended_at timestamptz,
  suspended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT owner_profiles_phone_check
    CHECK (phone ~ '^[0-9]{10,15}$')
);

DROP TRIGGER IF EXISTS trg_owner_profiles_updated_at ON public.owner_profiles;
CREATE TRIGGER trg_owner_profiles_updated_at
BEFORE UPDATE ON public.owner_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


/* ============================================================
   5. AUTH USER AUTO PROFILE CREATION
   ============================================================ */

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  v_role :=
    CASE
      WHEN NEW.raw_user_meta_data ->> 'role' IN ('platform_admin', 'owner')
        THEN (NEW.raw_user_meta_data ->> 'role')::public.user_role
      ELSE 'owner'::public.user_role
    END;

  INSERT INTO public.profiles (
    id,
    email,
    phone,
    full_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email::citext,
    NEW.phone,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
      NULLIF(NEW.raw_user_meta_data ->> 'name', ''),
      split_part(COALESCE(NEW.email, ''), '@', 1),
      ''
    ),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();


/* ============================================================
   6. SECURITY HELPER FUNCTIONS
   ============================================================ */

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'platform_admin'
      AND p.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.current_owner_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT op.id
  FROM public.owner_profiles op
  JOIN public.profiles p ON p.id = op.profile_id
  WHERE op.profile_id = auth.uid()
    AND p.role = 'owner'
    AND p.is_active = true
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.current_approved_owner_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT op.id
  FROM public.owner_profiles op
  JOIN public.profiles p ON p.id = op.profile_id
  WHERE op.profile_id = auth.uid()
    AND p.role = 'owner'
    AND p.is_active = true
    AND op.status = 'approved'
  LIMIT 1;
$$;


/* ============================================================
   7. MASTER LOCATION TABLES
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name text NOT NULL UNIQUE,
  code text UNIQUE,

  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT states_name_not_blank
    CHECK (length(trim(name)) > 0)
);

DROP TRIGGER IF EXISTS trg_states_updated_at ON public.states;
CREATE TRIGGER trg_states_updated_at
BEFORE UPDATE ON public.states
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE IF NOT EXISTS public.districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE RESTRICT,

  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT districts_name_not_blank
    CHECK (length(trim(name)) > 0),

  CONSTRAINT districts_state_name_unique
    UNIQUE (state_id, name),

  CONSTRAINT districts_id_state_unique
    UNIQUE (id, state_id)
);

DROP TRIGGER IF EXISTS trg_districts_updated_at ON public.districts;
CREATE TRIGGER trg_districts_updated_at
BEFORE UPDATE ON public.districts
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE RESTRICT,
  district_id uuid NOT NULL,

  name text NOT NULL,
  slug text NOT NULL,

  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT locations_name_not_blank
    CHECK (length(trim(name)) > 0),

  CONSTRAINT locations_slug_not_blank
    CHECK (length(trim(slug)) > 0),

  CONSTRAINT locations_district_state_fk
    FOREIGN KEY (district_id, state_id)
    REFERENCES public.districts(id, state_id)
    ON DELETE RESTRICT,

  CONSTRAINT locations_district_slug_unique
    UNIQUE (district_id, slug),

  CONSTRAINT locations_id_district_state_unique
    UNIQUE (id, district_id, state_id)
);

DROP TRIGGER IF EXISTS trg_locations_updated_at ON public.locations;
CREATE TRIGGER trg_locations_updated_at
BEFORE UPDATE ON public.locations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


/* ============================================================
   8. PROPERTY TABLE
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  owner_id uuid NOT NULL REFERENCES public.owner_profiles(id) ON DELETE CASCADE,

  state_id uuid NOT NULL REFERENCES public.states(id) ON DELETE RESTRICT,
  district_id uuid NOT NULL,
  location_id uuid NOT NULL,

  name text NOT NULL,
  slug text NOT NULL UNIQUE,

  property_type public.property_type NOT NULL DEFAULT 'homestay',

  short_description text,
  description text,

  address text NOT NULL,
  landmark text,
  pincode text,

  latitude numeric(10,7),
  longitude numeric(10,7),

  contact_phone text NOT NULL,
  contact_email citext,
  whatsapp_number text,

  cover_image text,
  gallery_images text[] NOT NULL DEFAULT '{}',

  amenities text[] NOT NULL DEFAULT '{}',
  rules text[] NOT NULL DEFAULT '{}',

  check_in_time time NOT NULL DEFAULT '12:00',
  check_out_time time NOT NULL DEFAULT '11:00',

  status public.property_status NOT NULL DEFAULT 'draft',

  is_featured boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,

  rating_average numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,

  admin_notes text,

  submitted_at timestamptz,

  approved_at timestamptz,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  rejected_at timestamptz,
  rejected_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  suspended_at timestamptz,
  suspended_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT properties_name_not_blank
    CHECK (length(trim(name)) > 0),

  CONSTRAINT properties_slug_not_blank
    CHECK (length(trim(slug)) > 0),

  CONSTRAINT properties_contact_phone_check
    CHECK (contact_phone ~ '^[0-9]{10,15}$'),

  CONSTRAINT properties_whatsapp_number_check
    CHECK (whatsapp_number IS NULL OR whatsapp_number ~ '^[0-9]{10,15}$'),

  CONSTRAINT properties_pincode_check
    CHECK (pincode IS NULL OR pincode ~ '^[0-9]{4,12}$'),

  CONSTRAINT properties_latitude_check
    CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90)),

  CONSTRAINT properties_longitude_check
    CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180)),

  CONSTRAINT properties_rating_average_check
    CHECK (rating_average >= 0 AND rating_average <= 5),

  CONSTRAINT properties_rating_count_check
    CHECK (rating_count >= 0),

  CONSTRAINT properties_district_state_fk
    FOREIGN KEY (district_id, state_id)
    REFERENCES public.districts(id, state_id)
    ON DELETE RESTRICT,

  CONSTRAINT properties_location_district_state_fk
    FOREIGN KEY (location_id, district_id, state_id)
    REFERENCES public.locations(id, district_id, state_id)
    ON DELETE RESTRICT,

  CONSTRAINT properties_id_owner_unique
    UNIQUE (id, owner_id)
);

DROP TRIGGER IF EXISTS trg_properties_updated_at ON public.properties;
CREATE TRIGGER trg_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


/* ============================================================
   9. PROPERTY ROOMS / COTTAGES TABLE
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.property_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,

  name text NOT NULL,
  slug text NOT NULL,

  room_type text NOT NULL DEFAULT 'room',
  description text,

  bed_type text,

  max_adults integer NOT NULL DEFAULT 2,
  max_children integer NOT NULL DEFAULT 0,
  max_guests integer NOT NULL DEFAULT 2,

  weekday_rate numeric(12,2) NOT NULL DEFAULT 0,
  weekend_rate numeric(12,2) NOT NULL DEFAULT 0,
  season_rate numeric(12,2) NOT NULL DEFAULT 0,
  holiday_rate numeric(12,2) NOT NULL DEFAULT 0,
  child_rate numeric(12,2) NOT NULL DEFAULT 0,
  extra_bed_rate numeric(12,2) NOT NULL DEFAULT 0,

  allow_extra_bed boolean NOT NULL DEFAULT false,

  amenities text[] NOT NULL DEFAULT '{}',

  cover_image text,
  gallery_images text[] NOT NULL DEFAULT '{}',

  status public.room_status NOT NULL DEFAULT 'active',

  sort_order integer NOT NULL DEFAULT 0,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT property_rooms_name_not_blank
    CHECK (length(trim(name)) > 0),

  CONSTRAINT property_rooms_slug_not_blank
    CHECK (length(trim(slug)) > 0),

  CONSTRAINT property_rooms_max_adults_check
    CHECK (max_adults >= 1),

  CONSTRAINT property_rooms_max_children_check
    CHECK (max_children >= 0),

  CONSTRAINT property_rooms_max_guests_check
    CHECK (max_guests >= 1 AND max_guests >= max_adults),

  CONSTRAINT property_rooms_rates_check
    CHECK (
      weekday_rate >= 0
      AND weekend_rate >= 0
      AND season_rate >= 0
      AND holiday_rate >= 0
      AND child_rate >= 0
      AND extra_bed_rate >= 0
    ),

  CONSTRAINT property_rooms_property_slug_unique
    UNIQUE (property_id, slug),

  CONSTRAINT property_rooms_id_property_unique
    UNIQUE (id, property_id)
);

DROP TRIGGER IF EXISTS trg_property_rooms_updated_at ON public.property_rooms;
CREATE TRIGGER trg_property_rooms_updated_at
BEFORE UPDATE ON public.property_rooms
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


/* ============================================================
   10. BOOKING GUESTS
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.booking_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  full_name text NOT NULL,
  phone text NOT NULL,
  email citext,

  address text,
  city text,
  state text,
  pincode text,

  notes text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT booking_guests_name_not_blank
    CHECK (length(trim(full_name)) > 0),

  CONSTRAINT booking_guests_phone_check
    CHECK (phone ~ '^[0-9]{10}$'),

  CONSTRAINT booking_guests_pincode_check
    CHECK (pincode IS NULL OR pincode ~ '^[0-9]{4,12}$')
);

DROP TRIGGER IF EXISTS trg_booking_guests_updated_at ON public.booking_guests;
CREATE TRIGGER trg_booking_guests_updated_at
BEFORE UPDATE ON public.booking_guests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


/* ============================================================
   11. BOOKING CODE COUNTER
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.booking_code_counters (
  code_date date PRIMARY KEY,
  last_value integer NOT NULL DEFAULT 0
);


/* ============================================================
   12. BOOKINGS
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  booking_code text UNIQUE,

  owner_id uuid NOT NULL,
  property_id uuid NOT NULL,
  room_id uuid NOT NULL,
  guest_id uuid NOT NULL REFERENCES public.booking_guests(id) ON DELETE RESTRICT,

  status public.booking_status NOT NULL DEFAULT 'pending',

  payment_method public.payment_method NOT NULL DEFAULT 'pay_on_arrival',
  payment_status public.payment_status NOT NULL DEFAULT 'unpaid',

  source text NOT NULL DEFAULT 'website',

  check_in_date date NOT NULL,
  check_out_date date NOT NULL,

  nights integer GENERATED ALWAYS AS (check_out_date - check_in_date) STORED,

  adults integer NOT NULL DEFAULT 1,
  children integer NOT NULL DEFAULT 0,
  infants integer NOT NULL DEFAULT 0,

  total_guests integer GENERATED ALWAYS AS (adults + children + infants) STORED,

  weekday_rate_snapshot numeric(12,2) NOT NULL DEFAULT 0,
  weekend_rate_snapshot numeric(12,2) NOT NULL DEFAULT 0,
  season_rate_snapshot numeric(12,2) NOT NULL DEFAULT 0,
  holiday_rate_snapshot numeric(12,2) NOT NULL DEFAULT 0,
  child_rate_snapshot numeric(12,2) NOT NULL DEFAULT 0,
  extra_bed_rate_snapshot numeric(12,2) NOT NULL DEFAULT 0,

  base_amount numeric(12,2) NOT NULL DEFAULT 0,
  extra_charges_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,

  special_requests text,
  admin_notes text,
  owner_notes text,

  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  completed_at timestamptz,
  completed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT bookings_code_not_blank
    CHECK (booking_code IS NULL OR length(trim(booking_code)) > 0),

  CONSTRAINT bookings_source_check
    CHECK (source IN ('website', 'owner', 'admin', 'phone', 'whatsapp', 'walk_in', 'other')),

  CONSTRAINT bookings_date_check
    CHECK (check_out_date > check_in_date),

  CONSTRAINT bookings_guest_count_check
    CHECK (adults >= 1 AND children >= 0 AND infants >= 0),

  CONSTRAINT bookings_amounts_check
    CHECK (
      weekday_rate_snapshot >= 0
      AND weekend_rate_snapshot >= 0
      AND season_rate_snapshot >= 0
      AND holiday_rate_snapshot >= 0
      AND child_rate_snapshot >= 0
      AND extra_bed_rate_snapshot >= 0
      AND base_amount >= 0
      AND extra_charges_amount >= 0
      AND discount_amount >= 0
      AND total_amount >= 0
    ),

  CONSTRAINT bookings_property_owner_fk
    FOREIGN KEY (property_id, owner_id)
    REFERENCES public.properties(id, owner_id)
    ON DELETE RESTRICT,

  CONSTRAINT bookings_room_property_fk
    FOREIGN KEY (room_id, property_id)
    REFERENCES public.property_rooms(id, property_id)
    ON DELETE RESTRICT
);

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


/* Prevent double booking for same room/date range.
   Pending and confirmed bookings block availability. */

ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS bookings_no_room_overlap;

ALTER TABLE public.bookings
ADD CONSTRAINT bookings_no_room_overlap
EXCLUDE USING gist (
  room_id WITH =,
  daterange(check_in_date, check_out_date, '[)') WITH &&
)
WHERE (
  status IN ('pending'::public.booking_status, 'confirmed'::public.booking_status)
);


/* ============================================================
   13. BOOKING STATUS HISTORY
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  old_status public.booking_status,
  new_status public.booking_status NOT NULL,

  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  remarks text,

  created_at timestamptz NOT NULL DEFAULT now()
);


/* ============================================================
   14. BOOKING PAYMENTS
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.booking_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  amount numeric(12,2) NOT NULL,

  payment_method public.payment_method NOT NULL DEFAULT 'cash',
  payment_status public.payment_status NOT NULL DEFAULT 'paid',

  payment_date date NOT NULL DEFAULT current_date,
  reference_number text,
  notes text,

  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT booking_payments_amount_check
    CHECK (amount > 0)
);


/* ============================================================
   15. BOOKING CHARGES / DISCOUNTS
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.booking_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,

  charge_type public.charge_type NOT NULL,
  description text,

  amount numeric(12,2) NOT NULL,

  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT booking_charges_amount_check
    CHECK (amount >= 0)
);


/* ============================================================
   16. INVOICES
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  booking_id uuid NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,

  invoice_number text UNIQUE,

  subtotal_amount numeric(12,2) NOT NULL DEFAULT 0,
  extra_charges_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  balance_amount numeric(12,2) NOT NULL DEFAULT 0,

  status public.invoice_status NOT NULL DEFAULT 'draft',

  issued_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT invoices_amounts_check
    CHECK (
      subtotal_amount >= 0
      AND extra_charges_amount >= 0
      AND discount_amount >= 0
      AND total_amount >= 0
      AND paid_amount >= 0
      AND balance_amount >= 0
    )
);

DROP TRIGGER IF EXISTS trg_invoices_updated_at ON public.invoices;
CREATE TRIGGER trg_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


/* ============================================================
   17. PLATFORM SETTINGS
   ============================================================ */

CREATE TABLE IF NOT EXISTS public.platform_settings (
  setting_key text PRIMARY KEY,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  is_public boolean NOT NULL DEFAULT false,

  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT platform_settings_key_not_blank
    CHECK (length(trim(setting_key)) > 0)
);


/* ============================================================
   18. BOOKING CODE FUNCTION
   ============================================================ */

CREATE OR REPLACE FUNCTION public.generate_booking_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date date := current_date;
  v_next integer;
  v_code text;
BEGIN
  INSERT INTO public.booking_code_counters (code_date, last_value)
  VALUES (v_date, 1)
  ON CONFLICT (code_date)
  DO UPDATE SET last_value = public.booking_code_counters.last_value + 1
  RETURNING last_value INTO v_next;

  v_code := 'STAY-' || to_char(v_date, 'YYYYMMDD') || '-' || lpad(v_next::text, 4, '0');

  RETURN v_code;
END;
$$;

ALTER TABLE public.bookings
ALTER COLUMN booking_code SET DEFAULT public.generate_booking_code();

UPDATE public.bookings
SET booking_code = public.generate_booking_code()
WHERE booking_code IS NULL;

ALTER TABLE public.bookings
ALTER COLUMN booking_code SET NOT NULL;


/* ============================================================
   19. BOOKING STATUS HISTORY TRIGGER
   ============================================================ */

CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by,
      remarks
    )
    VALUES (
      NEW.id,
      NULL,
      NEW.status,
      COALESCE(NEW.created_by, auth.uid()),
      'Booking created'
    );

    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.booking_status_history (
      booking_id,
      old_status,
      new_status,
      changed_by,
      remarks
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      'Booking status changed'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_status_history_insert ON public.bookings;
CREATE TRIGGER trg_booking_status_history_insert
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking_status_change();

DROP TRIGGER IF EXISTS trg_booking_status_history_update ON public.bookings;
CREATE TRIGGER trg_booking_status_history_update
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.log_booking_status_change();


/* ============================================================
   20. BOOKING FINANCIAL RECALCULATION
   ============================================================ */

CREATE OR REPLACE FUNCTION public.recalculate_booking_financials(p_booking_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base numeric(12,2);
  v_extra numeric(12,2);
  v_discount numeric(12,2);
  v_total numeric(12,2);
  v_paid numeric(12,2);
  v_payment_status public.payment_status;
BEGIN
  SELECT base_amount
  INTO v_base
  FROM public.bookings
  WHERE id = p_booking_id;

  IF v_base IS NULL THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(SUM(CASE WHEN charge_type = 'discount' THEN 0 ELSE amount END), 0),
    COALESCE(SUM(CASE WHEN charge_type = 'discount' THEN amount ELSE 0 END), 0)
  INTO v_extra, v_discount
  FROM public.booking_charges
  WHERE booking_id = p_booking_id;

  v_total := GREATEST(v_base + v_extra - v_discount, 0);

  SELECT COALESCE(SUM(amount), 0)
  INTO v_paid
  FROM public.booking_payments
  WHERE booking_id = p_booking_id
    AND payment_status = 'paid';

  v_payment_status :=
    CASE
      WHEN v_total = 0 THEN 'waived'::public.payment_status
      WHEN v_paid <= 0 THEN 'unpaid'::public.payment_status
      WHEN v_paid < v_total THEN 'partially_paid'::public.payment_status
      ELSE 'paid'::public.payment_status
    END;

  UPDATE public.bookings
  SET
    extra_charges_amount = v_extra,
    discount_amount = v_discount,
    total_amount = v_total,
    payment_status = v_payment_status
  WHERE id = p_booking_id;

  INSERT INTO public.invoices (
    booking_id,
    subtotal_amount,
    extra_charges_amount,
    discount_amount,
    total_amount,
    paid_amount,
    balance_amount,
    status
  )
  VALUES (
    p_booking_id,
    v_base,
    v_extra,
    v_discount,
    v_total,
    v_paid,
    GREATEST(v_total - v_paid, 0),
    CASE
      WHEN v_total > 0 AND v_paid >= v_total THEN 'paid'::public.invoice_status
      ELSE 'draft'::public.invoice_status
    END
  )
  ON CONFLICT (booking_id)
  DO UPDATE SET
    subtotal_amount = EXCLUDED.subtotal_amount,
    extra_charges_amount = EXCLUDED.extra_charges_amount,
    discount_amount = EXCLUDED.discount_amount,
    total_amount = EXCLUDED.total_amount,
    paid_amount = EXCLUDED.paid_amount,
    balance_amount = EXCLUDED.balance_amount,
    status =
      CASE
        WHEN EXCLUDED.total_amount > 0 AND EXCLUDED.paid_amount >= EXCLUDED.total_amount
          THEN 'paid'::public.invoice_status
        ELSE public.invoices.status
      END,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.recalculate_booking_financials_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id uuid;
BEGIN
  v_booking_id := COALESCE(NEW.booking_id, OLD.booking_id);
  PERFORM public.recalculate_booking_financials(v_booking_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalculate_after_charge_insert ON public.booking_charges;
CREATE TRIGGER trg_recalculate_after_charge_insert
AFTER INSERT ON public.booking_charges
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_booking_financials_trigger();

DROP TRIGGER IF EXISTS trg_recalculate_after_charge_update ON public.booking_charges;
CREATE TRIGGER trg_recalculate_after_charge_update
AFTER UPDATE ON public.booking_charges
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_booking_financials_trigger();

DROP TRIGGER IF EXISTS trg_recalculate_after_charge_delete ON public.booking_charges;
CREATE TRIGGER trg_recalculate_after_charge_delete
AFTER DELETE ON public.booking_charges
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_booking_financials_trigger();

DROP TRIGGER IF EXISTS trg_recalculate_after_payment_insert ON public.booking_payments;
CREATE TRIGGER trg_recalculate_after_payment_insert
AFTER INSERT ON public.booking_payments
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_booking_financials_trigger();

DROP TRIGGER IF EXISTS trg_recalculate_after_payment_update ON public.booking_payments;
CREATE TRIGGER trg_recalculate_after_payment_update
AFTER UPDATE ON public.booking_payments
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_booking_financials_trigger();

DROP TRIGGER IF EXISTS trg_recalculate_after_payment_delete ON public.booking_payments;
CREATE TRIGGER trg_recalculate_after_payment_delete
AFTER DELETE ON public.booking_payments
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_booking_financials_trigger();


/* ============================================================
   21. PROTECT ADMIN-ONLY FIELDS
   ============================================================ */

CREATE OR REPLACE FUNCTION public.protect_owner_profile_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
    OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
    OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
    OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at
    OR NEW.rejected_by IS DISTINCT FROM OLD.rejected_by
    OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
    OR NEW.suspended_by IS DISTINCT FROM OLD.suspended_by
    OR NEW.remarks IS DISTINCT FROM OLD.remarks
  THEN
    RAISE EXCEPTION 'Only platform admin can update owner approval fields.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_owner_profile_admin_fields ON public.owner_profiles;
CREATE TRIGGER trg_protect_owner_profile_admin_fields
BEFORE UPDATE ON public.owner_profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_owner_profile_admin_fields();


CREATE OR REPLACE FUNCTION public.protect_property_admin_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    RAISE EXCEPTION 'Owner cannot be changed.';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
    AND NEW.status NOT IN ('draft'::public.property_status, 'pending_review'::public.property_status, 'inactive'::public.property_status)
  THEN
    RAISE EXCEPTION 'Only platform admin can approve, reject, suspend, or activate properties.';
  END IF;

  IF NEW.is_featured IS DISTINCT FROM OLD.is_featured
    OR NEW.is_verified IS DISTINCT FROM OLD.is_verified
    OR NEW.rating_average IS DISTINCT FROM OLD.rating_average
    OR NEW.rating_count IS DISTINCT FROM OLD.rating_count
    OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
    OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
    OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
    OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at
    OR NEW.rejected_by IS DISTINCT FROM OLD.rejected_by
    OR NEW.suspended_at IS DISTINCT FROM OLD.suspended_at
    OR NEW.suspended_by IS DISTINCT FROM OLD.suspended_by
  THEN
    RAISE EXCEPTION 'Only platform admin can update platform-controlled property fields.';
  END IF;

  IF NEW.status = 'pending_review'::public.property_status
    AND OLD.status IS DISTINCT FROM NEW.status
    AND NEW.submitted_at IS NULL
  THEN
    NEW.submitted_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_property_admin_fields ON public.properties;
CREATE TRIGGER trg_protect_property_admin_fields
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.protect_property_admin_fields();


/* ============================================================
   22. PUBLIC BOOKING REQUEST RPC
   ============================================================ */

CREATE OR REPLACE FUNCTION public.create_booking_request(
  p_room_id uuid,
  p_guest_full_name text,
  p_guest_phone text,
  p_guest_email text DEFAULT NULL,
  p_guest_address text DEFAULT NULL,
  p_check_in_date date DEFAULT NULL,
  p_check_out_date date DEFAULT NULL,
  p_adults integer DEFAULT 1,
  p_children integer DEFAULT 0,
  p_infants integer DEFAULT 0,
  p_special_requests text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room public.property_rooms%ROWTYPE;
  v_property public.properties%ROWTYPE;
  v_owner public.owner_profiles%ROWTYPE;
  v_guest_id uuid;
  v_booking_id uuid;
  v_booking_code text;
  v_base_amount numeric(12,2) := 0;
  v_total_guests integer;
  v_day date;
  v_rate numeric(12,2);
BEGIN
  IF p_room_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Room is required.');
  END IF;

  IF p_guest_full_name IS NULL OR length(trim(p_guest_full_name)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Guest name is required.');
  END IF;

  IF p_guest_phone IS NULL OR p_guest_phone !~ '^[0-9]{10}$' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Phone number must be exactly 10 digits.');
  END IF;

  IF p_check_in_date IS NULL OR p_check_out_date IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Check-in and check-out dates are required.');
  END IF;

  IF p_check_out_date <= p_check_in_date THEN
    RETURN jsonb_build_object('success', false, 'message', 'Check-out date must be after check-in date.');
  END IF;

  IF p_check_in_date < current_date THEN
    RETURN jsonb_build_object('success', false, 'message', 'Check-in date cannot be in the past.');
  END IF;

  IF p_adults < 1 OR p_children < 0 OR p_infants < 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Invalid guest count.');
  END IF;

  v_total_guests := p_adults + p_children + p_infants;

  SELECT *
  INTO v_room
  FROM public.property_rooms
  WHERE id = p_room_id
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Selected room is not available.');
  END IF;

  SELECT *
  INTO v_property
  FROM public.properties
  WHERE id = v_room.property_id
    AND status = 'active';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Property is not available for booking.');
  END IF;

  SELECT *
  INTO v_owner
  FROM public.owner_profiles
  WHERE id = v_property.owner_id
    AND status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Property owner is not approved.');
  END IF;

  IF p_adults > v_room.max_adults OR v_total_guests > v_room.max_guests THEN
    RETURN jsonb_build_object('success', false, 'message', 'Guest count exceeds room capacity.');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.room_id = p_room_id
      AND b.status IN ('pending', 'confirmed')
      AND daterange(b.check_in_date, b.check_out_date, '[)')
          && daterange(p_check_in_date, p_check_out_date, '[)')
  ) THEN
    RETURN jsonb_build_object('success', false, 'message', 'Room is already booked for the selected dates.');
  END IF;

  v_day := p_check_in_date;

  WHILE v_day < p_check_out_date LOOP
    IF EXTRACT(ISODOW FROM v_day) IN (6, 7) THEN
      v_rate := COALESCE(NULLIF(v_room.weekend_rate, 0), v_room.weekday_rate);
    ELSE
      v_rate := v_room.weekday_rate;
    END IF;

    v_base_amount := v_base_amount + v_rate;
    v_day := v_day + 1;
  END LOOP;

  INSERT INTO public.booking_guests (
    full_name,
    phone,
    email,
    address
  )
  VALUES (
    trim(p_guest_full_name),
    p_guest_phone,
    NULLIF(trim(COALESCE(p_guest_email, '')), '')::citext,
    NULLIF(trim(COALESCE(p_guest_address, '')), '')
  )
  RETURNING id INTO v_guest_id;

  INSERT INTO public.bookings (
    owner_id,
    property_id,
    room_id,
    guest_id,
    status,
    payment_method,
    payment_status,
    source,
    check_in_date,
    check_out_date,
    adults,
    children,
    infants,
    weekday_rate_snapshot,
    weekend_rate_snapshot,
    season_rate_snapshot,
    holiday_rate_snapshot,
    child_rate_snapshot,
    extra_bed_rate_snapshot,
    base_amount,
    total_amount,
    special_requests
  )
  VALUES (
    v_property.owner_id,
    v_property.id,
    v_room.id,
    v_guest_id,
    'pending',
    'pay_on_arrival',
    'unpaid',
    'website',
    p_check_in_date,
    p_check_out_date,
    p_adults,
    p_children,
    p_infants,
    v_room.weekday_rate,
    v_room.weekend_rate,
    v_room.season_rate,
    v_room.holiday_rate,
    v_room.child_rate,
    v_room.extra_bed_rate,
    v_base_amount,
    v_base_amount,
    NULLIF(trim(COALESCE(p_special_requests, '')), '')
  )
  RETURNING id, booking_code INTO v_booking_id, v_booking_code;

  PERFORM public.recalculate_booking_financials(v_booking_id);

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'booking_code', v_booking_code,
    'status', 'pending',
    'message', 'Thank you. Your booking request has been sent. The property owner will contact you shortly.'
  );

EXCEPTION
  WHEN exclusion_violation THEN
    RETURN jsonb_build_object('success', false, 'message', 'Room is already booked for the selected dates.');
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'message', 'Duplicate booking conflict. Please try again.');
  WHEN others THEN
    RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;


/* ============================================================
   23. INDEXES
   ============================================================ */

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

CREATE INDEX IF NOT EXISTS idx_owner_profiles_profile_id ON public.owner_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_owner_profiles_status ON public.owner_profiles(status);
CREATE INDEX IF NOT EXISTS idx_owner_profiles_business_name_trgm
  ON public.owner_profiles USING gin (business_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_states_active_sort ON public.states(is_active, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_districts_state_active ON public.districts(state_id, is_active, sort_order, name);

CREATE INDEX IF NOT EXISTS idx_locations_state_district_active
  ON public.locations(state_id, district_id, is_active, sort_order, name);
CREATE INDEX IF NOT EXISTS idx_locations_slug ON public.locations(slug);
CREATE INDEX IF NOT EXISTS idx_locations_name_trgm
  ON public.locations USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(state_id, district_id, location_id);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_properties_verified ON public.properties(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_properties_slug ON public.properties(slug);
CREATE INDEX IF NOT EXISTS idx_properties_name_trgm
  ON public.properties USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_properties_amenities_gin
  ON public.properties USING gin (amenities);

CREATE INDEX IF NOT EXISTS idx_property_rooms_property_id ON public.property_rooms(property_id);
CREATE INDEX IF NOT EXISTS idx_property_rooms_status ON public.property_rooms(status);
CREATE INDEX IF NOT EXISTS idx_property_rooms_type ON public.property_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_property_rooms_slug ON public.property_rooms(property_id, slug);
CREATE INDEX IF NOT EXISTS idx_property_rooms_rates ON public.property_rooms(weekday_rate, weekend_rate);
CREATE INDEX IF NOT EXISTS idx_property_rooms_amenities_gin
  ON public.property_rooms USING gin (amenities);

CREATE INDEX IF NOT EXISTS idx_booking_guests_phone ON public.booking_guests(phone);
CREATE INDEX IF NOT EXISTS idx_booking_guests_email ON public.booking_guests(email);
CREATE INDEX IF NOT EXISTS idx_booking_guests_name_trgm
  ON public.booking_guests USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_bookings_booking_code ON public.bookings(booking_code);
CREATE INDEX IF NOT EXISTS idx_bookings_owner_id ON public.bookings(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_guest_id ON public.bookings(guest_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_status_history_booking_id
  ON public.booking_status_history(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_status_history_created_at
  ON public.booking_status_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_id
  ON public.booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_payment_date
  ON public.booking_payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_booking_charges_booking_id
  ON public.booking_charges(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_charges_type
  ON public.booking_charges(charge_type);

CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

CREATE INDEX IF NOT EXISTS idx_platform_settings_is_public
  ON public.platform_settings(is_public);


/* ============================================================
   24. VIEWS
   ============================================================ */

CREATE OR REPLACE VIEW public.v_public_properties
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.property_type,
  p.short_description,
  p.description,
  p.address,
  p.landmark,
  p.pincode,
  p.latitude,
  p.longitude,
  p.contact_phone,
  p.whatsapp_number,
  p.cover_image,
  p.gallery_images,
  p.amenities,
  p.rules,
  p.check_in_time,
  p.check_out_time,
  p.is_featured,
  p.is_verified,
  p.rating_average,
  p.rating_count,
  s.name AS state_name,
  d.name AS district_name,
  l.name AS location_name,
  l.slug AS location_slug,
  COALESCE(MIN(NULLIF(r.weekday_rate, 0)), 0) AS starting_weekday_rate,
  COALESCE(MIN(NULLIF(r.weekend_rate, 0)), 0) AS starting_weekend_rate,
  COUNT(r.id) FILTER (WHERE r.status = 'active') AS active_room_count,
  p.created_at
FROM public.properties p
JOIN public.owner_profiles op ON op.id = p.owner_id
JOIN public.states s ON s.id = p.state_id
JOIN public.districts d ON d.id = p.district_id
JOIN public.locations l ON l.id = p.location_id
LEFT JOIN public.property_rooms r ON r.property_id = p.id
WHERE p.status = 'active'
  AND op.status = 'approved'
  AND s.is_active = true
  AND d.is_active = true
  AND l.is_active = true
GROUP BY
  p.id,
  s.name,
  d.name,
  l.name,
  l.slug;


CREATE OR REPLACE VIEW public.v_public_property_rooms
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.property_id,
  r.name,
  r.slug,
  r.room_type,
  r.description,
  r.bed_type,
  r.max_adults,
  r.max_children,
  r.max_guests,
  r.weekday_rate,
  r.weekend_rate,
  r.season_rate,
  r.holiday_rate,
  r.child_rate,
  r.extra_bed_rate,
  r.allow_extra_bed,
  r.amenities,
  r.cover_image,
  r.gallery_images,
  r.status,
  r.sort_order,
  r.created_at
FROM public.property_rooms r
JOIN public.properties p ON p.id = r.property_id
JOIN public.owner_profiles op ON op.id = p.owner_id
WHERE r.status = 'active'
  AND p.status = 'active'
  AND op.status = 'approved';


CREATE OR REPLACE VIEW public.v_owner_booking_details
WITH (security_invoker = true)
AS
SELECT
  b.id,
  b.booking_code,
  b.owner_id,
  b.property_id,
  b.room_id,
  b.guest_id,
  p.name AS property_name,
  r.name AS room_name,
  g.full_name AS guest_name,
  g.phone AS guest_phone,
  g.email AS guest_email,
  b.status,
  b.payment_method,
  b.payment_status,
  b.source,
  b.check_in_date,
  b.check_out_date,
  b.nights,
  b.adults,
  b.children,
  b.infants,
  b.total_guests,
  b.base_amount,
  b.extra_charges_amount,
  b.discount_amount,
  b.total_amount,
  b.special_requests,
  b.owner_notes,
  b.admin_notes,
  b.confirmed_at,
  b.cancelled_at,
  b.completed_at,
  b.created_at,
  b.updated_at
FROM public.bookings b
JOIN public.properties p ON p.id = b.property_id
JOIN public.property_rooms r ON r.id = b.room_id
JOIN public.booking_guests g ON g.id = b.guest_id;


/* ============================================================
   25. ROW LEVEL SECURITY
   ============================================================ */

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_code_counters ENABLE ROW LEVEL SECURITY;


/* -----------------------------
   profiles policies
   ----------------------------- */

DROP POLICY IF EXISTS profiles_select_own_or_admin ON public.profiles;
CREATE POLICY profiles_select_own_or_admin
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS profiles_update_own_or_admin ON public.profiles;
CREATE POLICY profiles_update_own_or_admin
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  id = auth.uid()
  OR public.is_platform_admin()
)
WITH CHECK (
  id = auth.uid()
  OR public.is_platform_admin()
);


/* -----------------------------
   owner_profiles policies
   ----------------------------- */

DROP POLICY IF EXISTS owner_profiles_select_own_or_admin ON public.owner_profiles;
CREATE POLICY owner_profiles_select_own_or_admin
ON public.owner_profiles
FOR SELECT
TO authenticated
USING (
  profile_id = auth.uid()
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS owner_profiles_insert_own ON public.owner_profiles;
CREATE POLICY owner_profiles_insert_own
ON public.owner_profiles
FOR INSERT
TO authenticated
WITH CHECK (
  profile_id = auth.uid()
);

DROP POLICY IF EXISTS owner_profiles_update_own_or_admin ON public.owner_profiles;
CREATE POLICY owner_profiles_update_own_or_admin
ON public.owner_profiles
FOR UPDATE
TO authenticated
USING (
  profile_id = auth.uid()
  OR public.is_platform_admin()
)
WITH CHECK (
  profile_id = auth.uid()
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS owner_profiles_delete_admin ON public.owner_profiles;
CREATE POLICY owner_profiles_delete_admin
ON public.owner_profiles
FOR DELETE
TO authenticated
USING (
  public.is_platform_admin()
);


/* -----------------------------
   states policies
   ----------------------------- */

DROP POLICY IF EXISTS states_public_select_active ON public.states;
CREATE POLICY states_public_select_active
ON public.states
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS states_admin_all ON public.states;
CREATE POLICY states_admin_all
ON public.states
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());


/* -----------------------------
   districts policies
   ----------------------------- */

DROP POLICY IF EXISTS districts_public_select_active ON public.districts;
CREATE POLICY districts_public_select_active
ON public.districts
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS districts_admin_all ON public.districts;
CREATE POLICY districts_admin_all
ON public.districts
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());


/* -----------------------------
   locations policies
   ----------------------------- */

DROP POLICY IF EXISTS locations_public_select_active ON public.locations;
CREATE POLICY locations_public_select_active
ON public.locations
FOR SELECT
TO anon, authenticated
USING (
  is_active = true
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS locations_admin_all ON public.locations;
CREATE POLICY locations_admin_all
ON public.locations
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());


/* -----------------------------
   properties policies
   ----------------------------- */

DROP POLICY IF EXISTS properties_public_select_active ON public.properties;
CREATE POLICY properties_public_select_active
ON public.properties
FOR SELECT
TO anon, authenticated
USING (
  (
    status = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.owner_profiles op
      WHERE op.id = properties.owner_id
        AND op.status = 'approved'
    )
  )
  OR owner_id = public.current_owner_profile_id()
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS properties_owner_insert ON public.properties;
CREATE POLICY properties_owner_insert
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = public.current_approved_owner_profile_id()
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS properties_owner_update ON public.properties;
CREATE POLICY properties_owner_update
ON public.properties
FOR UPDATE
TO authenticated
USING (
  owner_id = public.current_owner_profile_id()
  OR public.is_platform_admin()
)
WITH CHECK (
  owner_id = public.current_owner_profile_id()
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS properties_owner_delete ON public.properties;
CREATE POLICY properties_owner_delete
ON public.properties
FOR DELETE
TO authenticated
USING (
  owner_id = public.current_owner_profile_id()
  OR public.is_platform_admin()
);


/* -----------------------------
   property_rooms policies
   ----------------------------- */

DROP POLICY IF EXISTS property_rooms_public_select_active ON public.property_rooms;
CREATE POLICY property_rooms_public_select_active
ON public.property_rooms
FOR SELECT
TO anon, authenticated
USING (
  (
    status = 'active'
    AND EXISTS (
      SELECT 1
      FROM public.properties p
      JOIN public.owner_profiles op ON op.id = p.owner_id
      WHERE p.id = property_rooms.property_id
        AND p.status = 'active'
        AND op.status = 'approved'
    )
  )
  OR EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_rooms.property_id
      AND p.owner_id = public.current_owner_profile_id()
  )
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS property_rooms_owner_insert ON public.property_rooms;
CREATE POLICY property_rooms_owner_insert
ON public.property_rooms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_rooms.property_id
      AND p.owner_id = public.current_owner_profile_id()
  )
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS property_rooms_owner_update ON public.property_rooms;
CREATE POLICY property_rooms_owner_update
ON public.property_rooms
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_rooms.property_id
      AND p.owner_id = public.current_owner_profile_id()
  )
  OR public.is_platform_admin()
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_rooms.property_id
      AND p.owner_id = public.current_owner_profile_id()
  )
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS property_rooms_owner_delete ON public.property_rooms;
CREATE POLICY property_rooms_owner_delete
ON public.property_rooms
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.properties p
    WHERE p.id = property_rooms.property_id
      AND p.owner_id = public.current_owner_profile_id()
  )
  OR public.is_platform_admin()
);


/* -----------------------------
   booking_guests policies
   ----------------------------- */

DROP POLICY IF EXISTS booking_guests_admin_all ON public.booking_guests;
CREATE POLICY booking_guests_admin_all
ON public.booking_guests
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS booking_guests_owner_select_related ON public.booking_guests;
CREATE POLICY booking_guests_owner_select_related
ON public.booking_guests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.guest_id = booking_guests.id
      AND b.owner_id = public.current_owner_profile_id()
  )
);

DROP POLICY IF EXISTS booking_guests_owner_insert ON public.booking_guests;
CREATE POLICY booking_guests_owner_insert
ON public.booking_guests
FOR INSERT
TO authenticated
WITH CHECK (
  public.current_owner_profile_id() IS NOT NULL
  OR public.is_platform_admin()
);


/* -----------------------------
   bookings policies
   ----------------------------- */

DROP POLICY IF EXISTS bookings_admin_all ON public.bookings;
CREATE POLICY bookings_admin_all
ON public.bookings
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS bookings_owner_select ON public.bookings;
CREATE POLICY bookings_owner_select
ON public.bookings
FOR SELECT
TO authenticated
USING (
  owner_id = public.current_owner_profile_id()
);

DROP POLICY IF EXISTS bookings_owner_insert ON public.bookings;
CREATE POLICY bookings_owner_insert
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  owner_id = public.current_owner_profile_id()
);

DROP POLICY IF EXISTS bookings_owner_update ON public.bookings;
CREATE POLICY bookings_owner_update
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  owner_id = public.current_owner_profile_id()
)
WITH CHECK (
  owner_id = public.current_owner_profile_id()
);


/* -----------------------------
   booking_status_history policies
   ----------------------------- */

DROP POLICY IF EXISTS booking_status_history_admin_all ON public.booking_status_history;
CREATE POLICY booking_status_history_admin_all
ON public.booking_status_history
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS booking_status_history_owner_select ON public.booking_status_history;
CREATE POLICY booking_status_history_owner_select
ON public.booking_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_status_history.booking_id
      AND b.owner_id = public.current_owner_profile_id()
  )
);


/* -----------------------------
   booking_payments policies
   ----------------------------- */

DROP POLICY IF EXISTS booking_payments_admin_all ON public.booking_payments;
CREATE POLICY booking_payments_admin_all
ON public.booking_payments
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS booking_payments_owner_all_related ON public.booking_payments;
CREATE POLICY booking_payments_owner_all_related
ON public.booking_payments
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_payments.booking_id
      AND b.owner_id = public.current_owner_profile_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_payments.booking_id
      AND b.owner_id = public.current_owner_profile_id()
  )
);


/* -----------------------------
   booking_charges policies
   ----------------------------- */

DROP POLICY IF EXISTS booking_charges_admin_all ON public.booking_charges;
CREATE POLICY booking_charges_admin_all
ON public.booking_charges
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS booking_charges_owner_all_related ON public.booking_charges;
CREATE POLICY booking_charges_owner_all_related
ON public.booking_charges
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_charges.booking_id
      AND b.owner_id = public.current_owner_profile_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = booking_charges.booking_id
      AND b.owner_id = public.current_owner_profile_id()
  )
);


/* -----------------------------
   invoices policies
   ----------------------------- */

DROP POLICY IF EXISTS invoices_admin_all ON public.invoices;
CREATE POLICY invoices_admin_all
ON public.invoices
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS invoices_owner_select_related ON public.invoices;
CREATE POLICY invoices_owner_select_related
ON public.invoices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = invoices.booking_id
      AND b.owner_id = public.current_owner_profile_id()
  )
);

DROP POLICY IF EXISTS invoices_owner_update_related ON public.invoices;
CREATE POLICY invoices_owner_update_related
ON public.invoices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = invoices.booking_id
      AND b.owner_id = public.current_owner_profile_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.id = invoices.booking_id
      AND b.owner_id = public.current_owner_profile_id()
  )
);


/* -----------------------------
   platform_settings policies
   ----------------------------- */

DROP POLICY IF EXISTS platform_settings_public_select ON public.platform_settings;
CREATE POLICY platform_settings_public_select
ON public.platform_settings
FOR SELECT
TO anon, authenticated
USING (
  is_public = true
  OR public.is_platform_admin()
);

DROP POLICY IF EXISTS platform_settings_admin_all ON public.platform_settings;
CREATE POLICY platform_settings_admin_all
ON public.platform_settings
FOR ALL
TO authenticated
USING (public.is_platform_admin())
WITH CHECK (public.is_platform_admin());


/* booking_code_counters: no direct client access */


/* ============================================================
   26. STORAGE BUCKET + STORAGE POLICIES
   ============================================================ */

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES (
  'stayinn-media',
  'stayinn-media',
  true,
  5242880,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS stayinn_media_public_read ON storage.objects;
CREATE POLICY stayinn_media_public_read
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'stayinn-media'
);

DROP POLICY IF EXISTS stayinn_media_authenticated_insert ON storage.objects;
CREATE POLICY stayinn_media_authenticated_insert
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'stayinn-media'
  AND (
    public.is_platform_admin()
    OR public.current_approved_owner_profile_id() IS NOT NULL
  )
);

DROP POLICY IF EXISTS stayinn_media_authenticated_update ON storage.objects;
CREATE POLICY stayinn_media_authenticated_update
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'stayinn-media'
  AND (
    public.is_platform_admin()
    OR public.current_approved_owner_profile_id() IS NOT NULL
  )
)
WITH CHECK (
  bucket_id = 'stayinn-media'
  AND (
    public.is_platform_admin()
    OR public.current_approved_owner_profile_id() IS NOT NULL
  )
);

DROP POLICY IF EXISTS stayinn_media_authenticated_delete ON storage.objects;
CREATE POLICY stayinn_media_authenticated_delete
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'stayinn-media'
  AND (
    public.is_platform_admin()
    OR public.current_approved_owner_profile_id() IS NOT NULL
  )
);


/* ============================================================
   27. GRANTS
   ============================================================ */

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.states TO anon, authenticated;
GRANT SELECT ON public.districts TO anon, authenticated;
GRANT SELECT ON public.locations TO anon, authenticated;
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT SELECT ON public.property_rooms TO anon, authenticated;

GRANT SELECT ON public.v_public_properties TO anon, authenticated;
GRANT SELECT ON public.v_public_property_rooms TO anon, authenticated;
GRANT SELECT ON public.v_owner_booking_details TO authenticated;

GRANT EXECUTE ON FUNCTION public.create_booking_request(
  uuid,
  text,
  text,
  text,
  text,
  date,
  date,
  integer,
  integer,
  integer,
  text
) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_owner_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_approved_owner_profile_id() TO authenticated;

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.owner_profiles TO authenticated;
GRANT ALL ON public.properties TO authenticated;
GRANT ALL ON public.property_rooms TO authenticated;
GRANT ALL ON public.booking_guests TO authenticated;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.booking_status_history TO authenticated;
GRANT ALL ON public.booking_payments TO authenticated;
GRANT ALL ON public.booking_charges TO authenticated;
GRANT ALL ON public.invoices TO authenticated;
GRANT ALL ON public.platform_settings TO authenticated;
GRANT ALL ON public.states TO authenticated;
GRANT ALL ON public.districts TO authenticated;
GRANT ALL ON public.locations TO authenticated;


/* ============================================================
   28. STARTER PLATFORM SETTINGS
   ============================================================ */

INSERT INTO public.platform_settings (
  setting_key,
  setting_value,
  description,
  is_public
)
VALUES
  (
    'platform_name',
    jsonb_build_object('value', 'StayInn'),
    'Public platform name',
    true
  ),
  (
    'support_phone',
    jsonb_build_object('value', ''),
    'Platform support phone number',
    true
  ),
  (
    'support_email',
    jsonb_build_object('value', ''),
    'Platform support email',
    true
  ),
  (
    'default_check_in_time',
    jsonb_build_object('value', '12:00'),
    'Default property check-in time',
    true
  ),
  (
    'default_check_out_time',
    jsonb_build_object('value', '11:00'),
    'Default property check-out time',
    true
  ),
  (
    'booking_terms',
    jsonb_build_object('value', 'Booking requests are subject to owner confirmation.'),
    'Default booking terms',
    true
  ),
  (
    'default_payment_method',
    jsonb_build_object('value', 'pay_on_arrival'),
    'Default MVP payment method',
    false
  )
ON CONFLICT (setting_key) DO NOTHING;


/* ============================================================
   29. STARTER MASTER DATA: MEGHALAYA
   You can edit or remove this section if needed.
   ============================================================ */

INSERT INTO public.states (name, code, sort_order)
VALUES
  ('Meghalaya', 'ML', 1)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.districts (state_id, name, sort_order)
SELECT s.id, d.name, d.sort_order
FROM public.states s
CROSS JOIN (
  VALUES
    ('East Khasi Hills', 1),
    ('West Khasi Hills', 2),
    ('South West Khasi Hills', 3),
    ('Ri Bhoi', 4),
    ('East Jaintia Hills', 5),
    ('West Jaintia Hills', 6),
    ('East Garo Hills', 7),
    ('West Garo Hills', 8),
    ('South Garo Hills', 9),
    ('South West Garo Hills', 10),
    ('North Garo Hills', 11),
    ('Eastern West Khasi Hills', 12)
) AS d(name, sort_order)
WHERE s.name = 'Meghalaya'
ON CONFLICT (state_id, name) DO NOTHING;

INSERT INTO public.locations (state_id, district_id, name, slug, sort_order)
SELECT s.id, d.id, x.name, x.slug, x.sort_order
FROM public.states s
JOIN public.districts d ON d.state_id = s.id
JOIN (
  VALUES
    ('East Khasi Hills', 'Shillong', 'shillong', 1),
    ('East Khasi Hills', 'Sohra', 'sohra', 2),
    ('East Khasi Hills', 'Mawphlang', 'mawphlang', 3),
    ('East Khasi Hills', 'Laitlum', 'laitlum', 4),
    ('East Khasi Hills', 'Mawlynnong', 'mawlynnong', 5),

    ('West Jaintia Hills', 'Jowai', 'jowai', 1),
    ('West Jaintia Hills', 'Dawki', 'dawki', 2),
    ('West Jaintia Hills', 'Shnongpdeng', 'shnongpdeng', 3),

    ('Ri Bhoi', 'Nongpoh', 'nongpoh', 1),
    ('Ri Bhoi', 'Umiam', 'umiam', 2),

    ('West Garo Hills', 'Tura', 'tura', 1)
) AS x(district_name, name, slug, sort_order)
  ON x.district_name = d.name
WHERE s.name = 'Meghalaya'
ON CONFLICT (district_id, slug) DO NOTHING;


/* ============================================================
   30. FINAL COMMENTS
   ============================================================ */

/*
After running this SQL:

1. Create your first admin user from Supabase Auth UI or your app signup.

2. Then run this manually by replacing the email:

   UPDATE public.profiles
   SET role = 'platform_admin', is_active = true
   WHERE email = 'your-admin-email@example.com';

3. Owner flow:
   - Owner signs up
   - Profile is auto-created
   - Owner creates owner_profiles row
   - Platform admin approves owner_profiles.status = 'approved'
   - Owner can create properties
   - Admin approves property by setting status = 'active'

4. Public booking:
   Call RPC: public.create_booking_request(...)

5. Images:
   Use bucket: stayinn-media

   Recommended paths:
   properties/{property_id}/cover/
   properties/{property_id}/gallery/
   properties/{property_id}/rooms/{room_id}/cover/
   properties/{property_id}/rooms/{room_id}/gallery/
*/

COMMIT;