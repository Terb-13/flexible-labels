-- Light ERP estimating loop: equipment, materials, routes, job steps, quote↔order.
-- EXAMPLE machine/material rates are loaded by scripts/seed-demo.ts — they are not
-- Flexible Label’s real plant rates.

alter table public.companies
  add column if not exists discount_percent numeric(5,2) not null default 0;

create type public.equipment_stage as enum ('printer', 'seamer', 'finisher', 'shipping');
create type public.material_kind as enum ('substrate', 'dye');
create type public.job_status as enum ('scheduled', 'running', 'done');
create type public.job_step_status as enum ('pending', 'running', 'done');

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stage public.equipment_stage not null,
  cost_rate numeric(10,2) not null,
  run_speed numeric(12,2) not null,
  waste_percent numeric(6,2) not null default 0,
  capabilities jsonb not null default '{}',
  setup_time_minutes numeric(8,2) not null default 0,
  notes text not null default 'EXAMPLE rate — not a published Flexible Label machine rate',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind public.material_kind not null,
  cost_per_sqin numeric(12,6) not null default 0,
  cost_per_unit numeric(12,4) not null default 0,
  attributes jsonb not null default '{}',
  notes text not null default 'EXAMPLE cost — not a published Flexible Label material cost',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.production_routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  match_attributes jsonb not null default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.route_steps (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.production_routes(id) on delete cascade,
  stage public.equipment_stage not null,
  step_order int not null,
  unique (route_id, step_order)
);

alter table public.schedule_jobs
  add column if not exists quote_id uuid references public.quotes(id),
  add column if not exists order_id uuid references public.orders(id),
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists status public.job_status not null default 'scheduled';

alter table public.schedule_jobs
  alter column resource drop not null,
  alter column start_day drop not null;

create table if not exists public.job_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.schedule_jobs(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id),
  route_step_id uuid references public.route_steps(id),
  planned_hours numeric(10,3) not null default 0,
  actual_hours numeric(10,3),
  actual_waste numeric(8,3),
  status public.job_step_status not null default 'pending',
  step_order int not null default 0
);

alter table public.quotes
  add column if not exists order_id uuid references public.orders(id);

alter table public.orders
  add column if not exists quote_id uuid references public.quotes(id);

create index if not exists job_steps_job_id_idx on public.job_steps (job_id, step_order);
create index if not exists schedule_jobs_started_at_idx on public.schedule_jobs (started_at);
create index if not exists quotes_company_id_idx on public.quotes (company_id);

alter table public.companies enable row level security;
alter table public.equipment enable row level security;
alter table public.materials enable row level security;
alter table public.production_routes enable row level security;
alter table public.route_steps enable row level security;
alter table public.quotes enable row level security;
alter table public.schedule_jobs enable row level security;
alter table public.job_steps enable row level security;
alter table public.orders enable row level security;

create policy "Authenticated read companies"
  on public.companies for select
  using (auth.uid() is not null);

create policy "Employees manage companies"
  on public.companies for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Public read equipment"
  on public.equipment for select
  using (true);

create policy "Employees manage equipment"
  on public.equipment for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Public read materials"
  on public.materials for select
  using (true);

create policy "Employees manage materials"
  on public.materials for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Public read production routes"
  on public.production_routes for select
  using (true);

create policy "Employees manage production routes"
  on public.production_routes for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Public read route steps"
  on public.route_steps for select
  using (true);

create policy "Employees manage route steps"
  on public.route_steps for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Employees manage quotes"
  on public.quotes for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Customers read own company quotes"
  on public.quotes for select
  using (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

create policy "Employees manage schedule jobs"
  on public.schedule_jobs for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Customers read own company jobs"
  on public.schedule_jobs for select
  using (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

create policy "Employees manage job steps"
  on public.job_steps for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Customers read job steps for own jobs"
  on public.job_steps for select
  using (
    job_id in (
      select id from public.schedule_jobs
      where company_id in (select company_id from public.profiles where id = auth.uid())
    )
  );

create policy "Employees manage orders"
  on public.orders for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));
