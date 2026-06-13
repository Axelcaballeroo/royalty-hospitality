create table if not exists public.daily_closures (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  date date not null,
  summary text,
  estimated_sales numeric not null default 0,
  completed_reservations integer not null default 0,
  no_shows integer not null default 0,
  courtesy_total numeric not null default 0,
  waste_total numeric not null default 0,
  incidents text,
  manager_notes text,
  status text not null default 'draft' check (status in ('draft', 'closed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, date)
);

create table if not exists public.courtesies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  closure_id uuid references public.daily_closures(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  employee_id uuid references public.employees(id) on delete set null,
  date date not null,
  item_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  estimated_value numeric not null default 0,
  reason text not null check (reason in ('cliente VIP', 'cumpleaños', 'compensación', 'influencer', 'invitado de casa', 'error de cocina', 'otro')),
  authorized_by text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.campaigns
  add column if not exists waste_alert_id uuid references public.waste_alerts(id) on delete set null;

create index if not exists daily_closures_business_date_idx on public.daily_closures(business_id, date desc);
create index if not exists courtesies_business_date_idx on public.courtesies(business_id, date desc);
create index if not exists courtesies_closure_idx on public.courtesies(closure_id);
create index if not exists campaigns_waste_alert_idx on public.campaigns(waste_alert_id);

alter table public.daily_closures enable row level security;
alter table public.courtesies enable row level security;

create policy "members can manage daily closures"
  on public.daily_closures for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage courtesies"
  on public.courtesies for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
