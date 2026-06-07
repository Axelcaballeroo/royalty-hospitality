alter table public.businesses
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_step integer not null default 1;

create table if not exists public.business_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  currency text not null default 'MXN',
  points_per_currency numeric(8, 2) not null default 1,
  reservation_auto_confirmed boolean not null default false,
  reservation_interval_minutes integer not null default 30,
  timezone text not null default 'America/Cancun',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  business_id uuid references public.businesses(id) on delete set null,
  action text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists business_settings_business_idx on public.business_settings(business_id);
create index if not exists admin_audit_logs_business_idx on public.admin_audit_logs(business_id, created_at desc);
create index if not exists admin_audit_logs_admin_idx on public.admin_audit_logs(admin_user_id, created_at desc);

alter table public.business_settings enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "members can manage business settings"
  on public.business_settings for all
  using (public.is_business_member(business_id))
  with check (public.can_admin_business(business_id));

create policy "superadmins can read admin audit logs"
  on public.admin_audit_logs for select
  using (
    exists (
      select 1
      from public.business_users
      where user_id = auth.uid()
        and role = 'superadmin'
        and status = 'active'
    )
  );

create policy "superadmins can insert admin audit logs"
  on public.admin_audit_logs for insert
  with check (
    exists (
      select 1
      from public.business_users
      where user_id = auth.uid()
        and role = 'superadmin'
        and status = 'active'
    )
  );

insert into public.modules (key, name, description)
values
  ('dashboard', 'Dashboard', 'Pulso principal del negocio.'),
  ('reports_basic', 'Reportes basicos', 'Reportes ejecutivos iniciales.'),
  ('reports_advanced', 'Reportes avanzados', 'Reportes multi-modulo completos.'),
  ('waste', 'Merma', 'Alertas y acciones de merma.'),
  ('wallet_placeholder', 'Wallet', 'Monedero interno y pagos futuros.'),
  ('multi_location_placeholder', 'Multi-location', 'Preparado para multiples sucursales.'),
  ('academy_placeholder', 'Academy', 'Preparado para capacitacion de equipos.')
on conflict (key) do nothing;
