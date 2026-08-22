-- Press-floor v1: footage/FPM press hours, operator clocks, plant shifts.
-- EXAMPLE delay reasons and Mon–Fri windows below are not Flexible Label’s
-- real plant policy. Do not treat seeded FPM as published press speeds.
-- 001 and 002 stay as applied — this file is additive only.

create type public.run_speed_unit as enum ('fpm', 'labels_per_hour');
create type public.clock_activity as enum ('setup', 'run', 'delay');
create type public.delay_category as enum (
  'wait_material',
  'wait_art',
  'breakdown',
  'changeover',
  'operator',
  'quality',
  'other'
);

alter table public.equipment
  add column if not exists run_speed_unit public.run_speed_unit not null default 'labels_per_hour',
  add column if not exists run_speed_fpm numeric(12,2);

update public.equipment
  set run_speed_unit = 'fpm'
  where stage = 'printer';

alter table public.schedule_jobs
  add column if not exists repeat_in numeric(8,3),
  add column if not exists across int,
  add column if not exists production_feet numeric(12,3);

alter table public.job_steps
  add column if not exists production_feet numeric(12,3),
  add column if not exists repeat_in numeric(8,3),
  add column if not exists across int,
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz;

create table if not exists public.delay_reasons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category public.delay_category not null,
  created_at timestamptz not null default now()
);

create table if not exists public.plant_shifts (
  id uuid primary key default gen_random_uuid(),
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  notes text not null default 'EXAMPLE plant window — not a published Flexible Label shift policy.',
  unique (weekday)
);

create table if not exists public.shop_floor_clocks (
  id uuid primary key default gen_random_uuid(),
  job_step_id uuid not null references public.job_steps(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id),
  operator_id uuid references public.profiles(id),
  activity public.clock_activity not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  delay_reason_id uuid references public.delay_reasons(id),
  notes text,
  qty_good numeric(12,2),
  qty_waste numeric(12,2),
  created_at timestamptz not null default now(),
  constraint shop_floor_clocks_delay_requires_reason check (
    activity <> 'delay' or delay_reason_id is not null
  ),
  constraint shop_floor_clocks_qty_nonneg check (
    (qty_good is null or qty_good >= 0)
    and (qty_waste is null or qty_waste >= 0)
  )
);

-- Finite capacity: at most one open clock per press.
create unique index if not exists shop_floor_clocks_one_open_per_equipment
  on public.shop_floor_clocks (equipment_id)
  where ended_at is null;

create index if not exists shop_floor_clocks_job_step_idx
  on public.shop_floor_clocks (job_step_id, started_at);

create index if not exists job_steps_equipment_window_idx
  on public.job_steps (equipment_id, started_at);

insert into public.delay_reasons (id, code, name, category)
values
  ('55555555-5555-4000-8000-000000000001', 'WAIT_MAT', 'EXAMPLE wait — material', 'wait_material'),
  ('55555555-5555-4000-8000-000000000002', 'WAIT_ART', 'EXAMPLE wait — art / approval', 'wait_art'),
  ('55555555-5555-4000-8000-000000000003', 'BREAK', 'EXAMPLE breakdown', 'breakdown'),
  ('55555555-5555-4000-8000-000000000004', 'CHGOVR', 'EXAMPLE changeover', 'changeover'),
  ('55555555-5555-4000-8000-000000000005', 'OPER', 'EXAMPLE operator unavailable', 'operator'),
  ('55555555-5555-4000-8000-000000000006', 'QUAL', 'EXAMPLE quality hold', 'quality'),
  ('55555555-5555-4000-8000-000000000007', 'OTHER', 'EXAMPLE other', 'other')
on conflict (id) do nothing;

-- EXAMPLE Mon–Fri 07:00–15:00. No overtime rules.
insert into public.plant_shifts (id, weekday, start_time, end_time, notes)
values
  ('66666666-6666-4000-8000-000000000001', 1, '07:00', '15:00', 'EXAMPLE plant window — not a published Flexible Label shift policy.'),
  ('66666666-6666-4000-8000-000000000002', 2, '07:00', '15:00', 'EXAMPLE plant window — not a published Flexible Label shift policy.'),
  ('66666666-6666-4000-8000-000000000003', 3, '07:00', '15:00', 'EXAMPLE plant window — not a published Flexible Label shift policy.'),
  ('66666666-6666-4000-8000-000000000004', 4, '07:00', '15:00', 'EXAMPLE plant window — not a published Flexible Label shift policy.'),
  ('66666666-6666-4000-8000-000000000005', 5, '07:00', '15:00', 'EXAMPLE plant window — not a published Flexible Label shift policy.')
on conflict (id) do nothing;

alter table public.delay_reasons enable row level security;
alter table public.plant_shifts enable row level security;
alter table public.shop_floor_clocks enable row level security;

create policy "Public read delay reasons"
  on public.delay_reasons for select
  using (true);

create policy "Employees manage delay reasons"
  on public.delay_reasons for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Public read plant shifts"
  on public.plant_shifts for select
  using (true);

create policy "Employees manage plant shifts"
  on public.plant_shifts for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Employees manage shop floor clocks"
  on public.shop_floor_clocks for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));
