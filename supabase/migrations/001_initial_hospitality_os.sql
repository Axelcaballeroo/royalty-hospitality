create extension if not exists "pgcrypto";

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text,
  logo_url text,
  cover_url text,
  phone text,
  email text,
  address text,
  city text,
  country text,
  public_description text,
  brand_primary_color text,
  brand_secondary_color text,
  instagram_url text,
  facebook_url text,
  whatsapp_url text,
  website_enabled boolean not null default true,
  reservation_enabled boolean not null default true,
  timezone text not null default 'America/Cancun',
  plan text not null default 'basic',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.business_users (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'staff' check (role in ('superadmin', 'owner', 'manager', 'staff')),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create table public.modules (
  key text primary key,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.business_modules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  module_key text not null references public.modules(key) on delete restrict,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, module_key)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  full_name text not null,
  phone text,
  email text,
  birthday date,
  tags text[] not null default '{}',
  notes text,
  total_visits integer not null default 0,
  total_spent numeric(12, 2) not null default 0,
  last_visit_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  date date not null,
  time time not null,
  party_size integer not null check (party_size > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  source text not null default 'manual' check (source in ('web', 'whatsapp', 'manual', 'google', 'instagram')),
  notes text,
  special_request text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  type text not null check (type in ('customer_created', 'reservation_created', 'reservation_confirmed', 'reservation_cancelled', 'reservation_no_show', 'visit_completed', 'note_added', 'task_created', 'campaign_sent', 'wallet_topup', 'points_earned')),
  title text not null,
  description text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  title text not null,
  content text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.internal_tasks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.internal_comments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  task_id uuid references public.internal_tasks(id) on delete cascade,
  note_id uuid references public.internal_notes(id) on delete cascade,
  comment text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (task_id is not null or note_id is not null)
);

create table public.business_hours (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (business_id, day_of_week)
);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  area text,
  capacity integer not null check (capacity > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (business_id, name)
);

create index business_users_business_id_idx on public.business_users(business_id);
create index business_modules_business_id_idx on public.business_modules(business_id);
create index customers_business_id_idx on public.customers(business_id);
create index customers_phone_idx on public.customers(phone);
create index reservations_business_date_idx on public.reservations(business_id, date, time);
create index reservations_customer_id_idx on public.reservations(customer_id);
create index customer_events_customer_id_idx on public.customer_events(customer_id, created_at desc);
create index internal_notes_customer_id_idx on public.internal_notes(customer_id);
create index internal_tasks_business_status_idx on public.internal_tasks(business_id, status);
create index internal_comments_task_id_idx on public.internal_comments(task_id);

alter table public.businesses enable row level security;
alter table public.business_users enable row level security;
alter table public.modules enable row level security;
alter table public.business_modules enable row level security;
alter table public.customers enable row level security;
alter table public.reservations enable row level security;
alter table public.customer_events enable row level security;
alter table public.internal_notes enable row level security;
alter table public.internal_tasks enable row level security;
alter table public.internal_comments enable row level security;
alter table public.business_hours enable row level security;
alter table public.tables enable row level security;

create or replace function public.is_business_member(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_users
    where business_id = target_business_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.can_admin_business(target_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_users
    where business_id = target_business_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('superadmin', 'owner', 'manager')
  );
$$;

create policy "members can read businesses"
  on public.businesses for select
  using (public.is_business_member(id));

create policy "admins can update businesses"
  on public.businesses for update
  using (public.can_admin_business(id))
  with check (public.can_admin_business(id));

create policy "members can read business users"
  on public.business_users for select
  using (public.is_business_member(business_id));

create policy "admins can manage business users"
  on public.business_users for all
  using (public.can_admin_business(business_id))
  with check (public.can_admin_business(business_id));

create policy "authenticated users can read modules"
  on public.modules for select
  to authenticated
  using (true);

create policy "members can manage business modules"
  on public.business_modules for all
  using (public.is_business_member(business_id))
  with check (public.can_admin_business(business_id));

create policy "members can manage customers"
  on public.customers for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage reservations"
  on public.reservations for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage customer events"
  on public.customer_events for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage internal notes"
  on public.internal_notes for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage internal tasks"
  on public.internal_tasks for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage internal comments"
  on public.internal_comments for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage business hours"
  on public.business_hours for all
  using (public.is_business_member(business_id))
  with check (public.can_admin_business(business_id));

create policy "members can manage tables"
  on public.tables for all
  using (public.is_business_member(business_id))
  with check (public.can_admin_business(business_id));

insert into public.modules (key, name, description)
values
  ('reservations', 'Reservas', 'Reservas conectadas al cliente y su historial.'),
  ('crm', 'Clientes CRM', 'Clientes, notas, tareas, comentarios e historial.'),
  ('marketing', 'Marketing', 'Segmentos y campanas futuras.'),
  ('loyalty', 'Fidelizacion', 'Puntos, niveles y beneficios.'),
  ('wallet', 'Wallet', 'Saldos, recargas y movimientos futuros.'),
  ('inventory', 'Inventario', 'Productos, existencia, vigencias y merma.'),
  ('hr', 'RRHH', 'Empleados, turnos y checador.'),
  ('reports', 'Reportes', 'Metricas generales del negocio.')
on conflict (key) do nothing;
