create table if not exists public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  points_balance integer not null default 0,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'black')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, customer_id)
);

alter table public.customer_events
  drop constraint if exists customer_events_type_check;

alter table public.customer_events
  add constraint customer_events_type_check
  check (type in ('customer_created', 'reservation_created', 'reservation_confirmed', 'reservation_cancelled', 'reservation_no_show', 'visit_completed', 'note_added', 'task_created', 'campaign_sent', 'wallet_topup', 'points_earned', 'reward_redeemed', 'points_adjusted'));

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  type text not null check (type in ('earn', 'redeem', 'adjustment', 'expired')),
  points integer not null,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  description text,
  points_required integer not null check (points_required > 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists loyalty_accounts_business_idx on public.loyalty_accounts(business_id);
create index if not exists loyalty_accounts_customer_idx on public.loyalty_accounts(customer_id);
create index if not exists loyalty_transactions_customer_idx on public.loyalty_transactions(customer_id, created_at desc);
create index if not exists rewards_business_status_idx on public.rewards(business_id, status);

alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.rewards enable row level security;

create policy "members can manage loyalty accounts"
  on public.loyalty_accounts for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage loyalty transactions"
  on public.loyalty_transactions for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage rewards"
  on public.rewards for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
