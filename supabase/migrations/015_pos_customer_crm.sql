alter table public.reservations
  add column if not exists pos_sale_id text,
  add column if not exists pos_total numeric(12, 2),
  add column if not exists pos_payment_method text,
  add column if not exists pos_closed_at timestamptz;

create table if not exists public.pos_customer_sales (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  sale_id text not null,
  folio text not null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  table_name text not null,
  order_type text not null,
  is_quick_sale boolean not null default false,
  gross numeric(12, 2) not null default 0 check (gross >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  courtesy numeric(12, 2) not null default 0 check (courtesy >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  payment_method text not null,
  waiter_name text,
  cash_register text,
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  payments jsonb not null default '[]'::jsonb check (jsonb_typeof(payments) = 'array'),
  amount_received numeric(12, 2),
  change_amount numeric(12, 2),
  closed_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (business_id, sale_id)
);

create index if not exists pos_customer_sales_customer_closed_idx
  on public.pos_customer_sales(customer_id, closed_at desc);
create index if not exists pos_customer_sales_reservation_idx
  on public.pos_customer_sales(reservation_id)
  where reservation_id is not null;

alter table public.pos_customer_sales enable row level security;

create policy "members can manage POS customer sales"
  on public.pos_customer_sales for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create or replace function public.sync_pos_customer_sale_to_crm()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.customers
    where id = new.customer_id
      and business_id = new.business_id
  ) then
    raise exception 'Customer does not belong to this business';
  end if;

  update public.customers
  set total_visits = total_visits + 1,
      total_spent = total_spent + new.total,
      last_visit_at = case
        when last_visit_at is null or last_visit_at < new.closed_at then new.closed_at
        else last_visit_at
      end,
      updated_at = now()
  where id = new.customer_id
    and business_id = new.business_id;

  if new.reservation_id is not null then
    update public.reservations
    set status = 'completed',
        pos_sale_id = new.sale_id,
        pos_total = new.total,
        pos_payment_method = new.payment_method,
        pos_closed_at = new.closed_at,
        updated_at = now()
    where id = new.reservation_id
      and business_id = new.business_id
      and customer_id = new.customer_id;
  end if;

  insert into public.customer_events (
    business_id, customer_id, reservation_id, type, title, description, metadata, created_by, created_at
  ) values (
    new.business_id,
    new.customer_id,
    new.reservation_id,
    'visit_completed',
    'Consumo cerrado',
    new.folio || ' · ' || new.payment_method,
    jsonb_build_object(
      'source', 'pos',
      'sale_id', new.sale_id,
      'folio', new.folio,
      'total', new.total,
      'table_name', new.table_name,
      'payment_method', new.payment_method
    ),
    new.created_by,
    new.closed_at
  );

  if new.discount > 0 then
    insert into public.customer_events (
      business_id, customer_id, reservation_id, type, title, description, metadata, created_by, created_at
    ) values (
      new.business_id, new.customer_id, new.reservation_id, 'visit_completed',
      'Descuento aplicado', 'Descuento recibido en ' || new.folio,
      jsonb_build_object('source', 'pos', 'sale_id', new.sale_id, 'discount', new.discount),
      new.created_by, new.closed_at
    );
  end if;

  if new.courtesy > 0 then
    insert into public.customer_events (
      business_id, customer_id, reservation_id, type, title, description, metadata, created_by, created_at
    ) values (
      new.business_id, new.customer_id, new.reservation_id, 'visit_completed',
      'Cortesía recibida', 'Cortesía registrada en ' || new.folio,
      jsonb_build_object('source', 'pos', 'sale_id', new.sale_id, 'courtesy', new.courtesy),
      new.created_by, new.closed_at
    );
  end if;

  insert into public.customer_events (
    business_id, customer_id, reservation_id, type, title, description, metadata, created_by, created_at
  ) values (
    new.business_id, new.customer_id, new.reservation_id, 'visit_completed',
    'Ticket emitido', 'Ticket ' || new.folio,
    jsonb_build_object('source', 'pos', 'sale_id', new.sale_id, 'folio', new.folio),
    new.created_by, new.closed_at
  );

  return new;
end;
$$;

drop trigger if exists pos_customer_sales_sync_crm on public.pos_customer_sales;
create trigger pos_customer_sales_sync_crm
  after insert on public.pos_customer_sales
  for each row execute function public.sync_pos_customer_sale_to_crm();
