alter table public.businesses
  add column if not exists public_description text,
  add column if not exists brand_primary_color text,
  add column if not exists brand_secondary_color text,
  add column if not exists instagram_url text,
  add column if not exists facebook_url text,
  add column if not exists whatsapp_url text,
  add column if not exists website_enabled boolean not null default true,
  add column if not exists reservation_enabled boolean not null default true;
