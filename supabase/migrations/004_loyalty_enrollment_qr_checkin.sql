alter table public.customers
  add column if not exists loyalty_code text unique,
  add column if not exists loyalty_enabled boolean not null default true;

create index if not exists customers_loyalty_code_idx on public.customers(loyalty_code);

alter table public.customer_events
  drop constraint if exists customer_events_type_check;

alter table public.customer_events
  add constraint customer_events_type_check
  check (type in ('customer_created', 'reservation_created', 'reservation_confirmed', 'reservation_cancelled', 'reservation_no_show', 'visit_completed', 'note_added', 'task_created', 'campaign_sent', 'wallet_topup', 'points_earned', 'reward_redeemed', 'points_adjusted'));
