-- Public API foundation support objects

create table if not exists public.home_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  discount_label text,
  image_path text,
  image_url text,
  button_label text default 'Explore',
  link_type text not null default 'search',
  link_value text,
  placement_key text not null default 'home_top',
  priority integer not null default 100,
  status text not null default 'active',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_home_banners_public_active
  on public.home_banners(status, placement_key, priority, starts_at, ends_at);

create or replace view public.v_public_home_banners as
select
  id,
  title,
  subtitle,
  discount_label,
  image_path,
  image_url,
  button_label,
  link_type,
  link_value,
  placement_key,
  priority
from public.home_banners
where status = 'active'
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at >= now());

create table if not exists public.public_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  property_id uuid,
  banner_id uuid,
  category text,
  metadata jsonb not null default '{}'::jsonb,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now()
);

create index if not exists idx_public_events_type_created_at
  on public.public_events(event_type, created_at desc);

create index if not exists idx_public_events_property_created_at
  on public.public_events(property_id, created_at desc);
