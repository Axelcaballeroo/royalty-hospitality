create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  category text,
  unit text not null check (unit in ('kg', 'g', 'l', 'ml', 'piece', 'box', 'bottle', 'pack')),
  min_stock numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  quantity numeric not null default 0 check (quantity >= 0),
  initial_quantity numeric not null default 0 check (initial_quantity >= 0),
  expiration_date date,
  cost numeric not null default 0,
  status text not null default 'ok' check (status in ('ok', 'near_expiration', 'urgent', 'expired', 'used')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  batch_id uuid references public.inventory_batches(id) on delete set null,
  type text not null check (type in ('entry', 'sale', 'waste', 'adjustment', 'transfer')),
  quantity numeric not null check (quantity > 0),
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.waste_alerts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete cascade,
  batch_id uuid references public.inventory_batches(id) on delete cascade,
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'urgent')),
  message text not null,
  estimated_loss numeric not null default 0,
  status text not null default 'open' check (status in ('open', 'resolved', 'ignored')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists inventory_items_business_status_idx on public.inventory_items(business_id, status);
create index if not exists inventory_batches_item_status_idx on public.inventory_batches(item_id, status);
create index if not exists inventory_batches_expiration_idx on public.inventory_batches(business_id, expiration_date);
create index if not exists inventory_movements_item_idx on public.inventory_movements(item_id, created_at desc);
create index if not exists waste_alerts_business_status_idx on public.waste_alerts(business_id, status);
create unique index if not exists waste_alerts_open_batch_idx
  on public.waste_alerts(batch_id)
  where status = 'open';

alter table public.inventory_items enable row level security;
alter table public.inventory_batches enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.waste_alerts enable row level security;

create policy "members can manage inventory items"
  on public.inventory_items for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage inventory batches"
  on public.inventory_batches for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage inventory movements"
  on public.inventory_movements for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage waste alerts"
  on public.waste_alerts for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
