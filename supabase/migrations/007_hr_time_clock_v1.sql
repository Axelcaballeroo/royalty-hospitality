create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text,
  email text,
  position text,
  status text not null default 'active' check (status in ('active', 'inactive', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  role text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'missed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.time_clock_entries (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  shift_id uuid references public.shifts(id) on delete set null,
  clock_in timestamptz not null,
  clock_out timestamptz,
  break_start timestamptz,
  break_end timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_business_status_idx on public.employees(business_id, status);
create index if not exists employees_business_user_idx on public.employees(business_id, user_id);
create index if not exists shifts_business_date_idx on public.shifts(business_id, date, status);
create index if not exists shifts_employee_date_idx on public.shifts(employee_id, date);
create index if not exists time_clock_business_open_idx
  on public.time_clock_entries(business_id, employee_id)
  where clock_out is null;
create index if not exists time_clock_employee_created_idx on public.time_clock_entries(employee_id, created_at desc);

alter table public.employees enable row level security;
alter table public.shifts enable row level security;
alter table public.time_clock_entries enable row level security;

create policy "members can manage employees"
  on public.employees for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage shifts"
  on public.shifts for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));

create policy "members can manage time clock entries"
  on public.time_clock_entries for all
  using (public.is_business_member(business_id))
  with check (public.is_business_member(business_id));
