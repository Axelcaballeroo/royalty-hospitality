alter table public.customer_events
  drop constraint if exists customer_events_type_check;

alter table public.customer_events
  add constraint customer_events_type_check
  check (type in (
    'customer_created',
    'reservation_created',
    'reservation_confirmed',
    'reservation_cancelled',
    'reservation_no_show',
    'visit_completed',
    'note_added',
    'task_created',
    'campaign_sent',
    'campaign_redeemed',
    'wallet_topup',
    'wallet_purchase',
    'wallet_adjustment',
    'points_earned',
    'reward_redeemed',
    'points_adjusted'
  ));

update public.modules
set name = 'Clientes',
    description = 'Base de clientes, fidelizacion, wallet, historial y reservas.'
where key = 'crm';
