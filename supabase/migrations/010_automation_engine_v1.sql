create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in ('customer_inactive_60d', 'customer_birthday_month', 'customer_reached_gold', 'customer_reached_black', 'wallet_balance_above', 'waste_alert_created', 'reservation_no_show', 'reservation_completed')),
  action_type text not null check (action_type in ('create_campaign_draft', 'create_internal_task', 'grant_reward', 'grant_points', 'create_dashboard_alert', 'create_wallet_bonus')),
  enabled boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, name)
);

create table if not exists public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  rule_id uuid references public.automation_rules(id) on delete set null,
  status text not null check (status in ('success', 'failed', 'skipped')),
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists automation_rules_business_enabled_idx on public.automation_rules(business_id, enabled);
create index if not exists automation_logs_business_created_idx on public.automation_logs(business_id, created_at desc);
create index if not exists automation_logs_rule_idx on public.automation_logs(rule_id, created_at desc);

alter table public.automation_rules enable row level security;
alter table public.automation_logs enable row level security;

create policy "members can manage automation rules"
  on public.automation_rules for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage automation logs"
  on public.automation_logs for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

insert into public.modules (key, name, description)
values
  ('automation', 'Automatizaciones', 'Reglas, disparadores, acciones simuladas e historial operativo.')
on conflict (key) do nothing;
