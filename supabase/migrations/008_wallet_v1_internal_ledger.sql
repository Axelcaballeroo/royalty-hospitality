create table if not exists public.wallet_accounts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  balance numeric(12, 2) not null default 0,
  currency text not null default 'MXN',
  status text not null default 'active' check (status in ('active', 'frozen', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, customer_id)
);

create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  type text not null check (type in ('topup', 'bonus', 'purchase', 'refund', 'adjustment')),
  amount numeric(12, 2) not null,
  description text,
  reference text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists wallet_accounts_business_status_idx on public.wallet_accounts(business_id, status);
create index if not exists wallet_accounts_customer_idx on public.wallet_accounts(customer_id);
create index if not exists wallet_transactions_customer_idx on public.wallet_transactions(customer_id, created_at desc);
create index if not exists wallet_transactions_business_type_idx on public.wallet_transactions(business_id, type, created_at desc);

alter table public.customer_events
  drop constraint if exists customer_events_type_check;

alter table public.customer_events
  add constraint customer_events_type_check
  check (type in ('customer_created', 'reservation_created', 'reservation_confirmed', 'reservation_cancelled', 'reservation_no_show', 'visit_completed', 'note_added', 'task_created', 'campaign_sent', 'campaign_redeemed', 'wallet_topup', 'wallet_purchase', 'wallet_adjustment', 'points_earned', 'reward_redeemed', 'points_adjusted'));

alter table public.wallet_accounts enable row level security;
alter table public.wallet_transactions enable row level security;

create policy "members can manage wallet accounts"
  on public.wallet_accounts for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage wallet transactions"
  on public.wallet_transactions for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
