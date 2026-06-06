create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  type text not null check (type in ('promotion', 'birthday', 'inactive_customers', 'vip', 'reward', 'waste_reduction', 'event')),
  segment_key text not null,
  message text not null,
  channel text not null default 'manual' check (channel in ('manual', 'whatsapp', 'email', 'sms', 'push')),
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'sent', 'cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_recipients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'opened', 'clicked', 'redeemed')),
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (campaign_id, customer_id)
);

create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  type text not null,
  message text not null,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_business_status_idx on public.campaigns(business_id, status);
create index if not exists campaign_recipients_campaign_idx on public.campaign_recipients(campaign_id);
create index if not exists campaign_recipients_customer_idx on public.campaign_recipients(customer_id, created_at desc);
create index if not exists message_templates_business_idx on public.message_templates(business_id, status);

alter table public.customer_events
  drop constraint if exists customer_events_type_check;

alter table public.customer_events
  add constraint customer_events_type_check
  check (type in ('customer_created', 'reservation_created', 'reservation_confirmed', 'reservation_cancelled', 'reservation_no_show', 'visit_completed', 'note_added', 'task_created', 'campaign_sent', 'campaign_redeemed', 'wallet_topup', 'points_earned', 'reward_redeemed', 'points_adjusted'));

alter table public.campaigns enable row level security;
alter table public.campaign_recipients enable row level security;
alter table public.message_templates enable row level security;

create policy "members can manage campaigns"
  on public.campaigns for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage campaign recipients"
  on public.campaign_recipients for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage message templates"
  on public.message_templates for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
