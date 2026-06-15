create index if not exists customers_business_status_idx on public.customers(business_id, status);
create index if not exists customers_business_last_visit_idx on public.customers(business_id, last_visit_at);
create index if not exists reservations_business_status_idx on public.reservations(business_id, status);
create index if not exists loyalty_accounts_business_customer_idx on public.loyalty_accounts(business_id, customer_id);
create index if not exists loyalty_transactions_business_customer_idx on public.loyalty_transactions(business_id, customer_id);
create index if not exists inventory_items_business_idx on public.inventory_items(business_id);
create index if not exists campaigns_business_status_created_idx on public.campaigns(business_id, status, created_at desc);
create index if not exists daily_closures_business_date_idx on public.daily_closures(business_id, date);
