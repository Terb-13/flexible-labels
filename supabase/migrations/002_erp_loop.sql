-- Flexible Label Group — ERP loop (quote ↔ order ↔ job steps)
-- Idempotent where possible. Still no second customers table — companies remain the account record.
-- Seeded cost_rate / cost_per_sqin values are EXAMPLE placeholders only, not Flexible Label production rates.

-- ---------------------------------------------------------------------------
-- Helpers (avoid profiles RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_employee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'employee'::public.user_role
  );
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.profiles
  where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------
alter table public.companies
  add column if not exists discount_percent numeric not null default 0;

comment on column public.companies.discount_percent is
  'Account discount. Seed/demo values are EXAMPLE placeholders, not live FLG contract rates.';

-- ---------------------------------------------------------------------------
-- equipment
-- ---------------------------------------------------------------------------
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  cost_rate numeric not null default 0,
  run_speed numeric not null default 0,
  waste_percent numeric not null default 0,
  setup_time_minutes numeric not null default 0,
  capabilities jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  constraint equipment_type_check check (type in ('printer', 'seamer', 'finisher', 'shipping'))
);

comment on table public.equipment is
  'Plant assets. cost_rate / run_speed / waste_percent are EXAMPLE placeholders until FLG confirms real rates.';
comment on column public.equipment.cost_rate is
  'EXAMPLE placeholder only. Do not treat as a Flexible Label production rate.';

-- ---------------------------------------------------------------------------
-- materials
-- ---------------------------------------------------------------------------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  cost_per_sqin numeric not null default 0,
  notes text
);

comment on table public.materials is
  'kind examples: substrate, dye. cost_per_sqin is an EXAMPLE placeholder, not a live FLG rate.';
comment on column public.materials.kind is
  'e.g. substrate | dye';
comment on column public.materials.cost_per_sqin is
  'EXAMPLE placeholder only. Do not treat as a Flexible Label production rate.';

-- ---------------------------------------------------------------------------
-- production_routes + route_steps
-- ---------------------------------------------------------------------------
create table if not exists public.production_routes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  match jsonb not null default '{}'::jsonb
);

comment on column public.production_routes.match is
  'Matcher keys: product, type, material, specs.';

create table if not exists public.route_steps (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.production_routes(id) on delete cascade,
  step_order int not null,
  equipment_type text not null,
  equipment_id uuid references public.equipment(id) on delete set null,
  constraint route_steps_equipment_type_check
    check (equipment_type in ('printer', 'seamer', 'finisher', 'shipping'))
);

-- ---------------------------------------------------------------------------
-- quotes ↔ orders
-- ---------------------------------------------------------------------------
alter table public.quotes
  add column if not exists order_id uuid references public.orders(id) on delete set null;

alter table public.orders
  add column if not exists quote_id uuid references public.quotes(id) on delete set null;

create index if not exists quotes_order_id_idx on public.quotes (order_id);
create index if not exists orders_quote_id_idx on public.orders (quote_id);

-- ---------------------------------------------------------------------------
-- schedule_jobs — header only; job_steps is source of truth
-- resource / start_day were Gantt fixtures and are not written by app code to the DB.
-- ---------------------------------------------------------------------------
alter table public.schedule_jobs
  add column if not exists quote_id uuid references public.quotes(id) on delete set null,
  add column if not exists order_id uuid references public.orders(id) on delete set null,
  add column if not exists equipment_id uuid references public.equipment(id) on delete set null,
  add column if not exists started_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists status text not null default 'scheduled';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'schedule_jobs_status_check'
      and conrelid = 'public.schedule_jobs'::regclass
  ) then
    alter table public.schedule_jobs
      add constraint schedule_jobs_status_check
      check (status in ('scheduled', 'running', 'done'));
  end if;
end
$$;

alter table public.schedule_jobs
  drop column if exists resource,
  drop column if exists start_day;

comment on table public.schedule_jobs is
  'Job header. job_steps is the source of truth for routing, timing, and equipment. equipment_id here is optional header-only.';
comment on column public.schedule_jobs.equipment_id is
  'Optional header-level equipment. Prefer job_steps.equipment_id.';

create index if not exists schedule_jobs_quote_id_idx on public.schedule_jobs (quote_id);
create index if not exists schedule_jobs_order_id_idx on public.schedule_jobs (order_id);
create index if not exists schedule_jobs_equipment_id_idx on public.schedule_jobs (equipment_id);

-- ---------------------------------------------------------------------------
-- job_steps
-- ---------------------------------------------------------------------------
create table if not exists public.job_steps (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.schedule_jobs(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id),
  route_step_id uuid references public.route_steps(id) on delete set null,
  step_order int not null,
  planned_hours numeric,
  actual_hours numeric,
  actual_waste numeric,
  status text not null default 'scheduled',
  constraint job_steps_status_check check (status in ('scheduled', 'running', 'done'))
);

comment on table public.job_steps is
  'Source of truth for job routing, equipment, planned/actual hours, and waste.';

create index if not exists job_steps_job_id_idx on public.job_steps (job_id);
create index if not exists route_steps_route_id_idx on public.route_steps (route_id);

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on table public.companies to authenticated;
grant select, insert, update, delete on table public.equipment to authenticated;
grant select, insert, update, delete on table public.materials to authenticated;
grant select, insert, update, delete on table public.production_routes to authenticated;
grant select, insert, update, delete on table public.route_steps to authenticated;
grant select, insert, update, delete on table public.quotes to authenticated;
grant select, insert, update, delete on table public.schedule_jobs to authenticated;
grant select, insert, update, delete on table public.job_steps to authenticated;

-- ---------------------------------------------------------------------------
-- RLS — employees (user_role = employee) full access.
-- Customers read only their company_id rows where applicable.
-- Plant tables (equipment, materials, routes, route_steps) have no company_id.
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.equipment enable row level security;
alter table public.materials enable row level security;
alter table public.production_routes enable row level security;
alter table public.route_steps enable row level security;
alter table public.quotes enable row level security;
alter table public.schedule_jobs enable row level security;
alter table public.job_steps enable row level security;

drop policy if exists "Employees manage companies" on public.companies;
create policy "Employees manage companies"
  on public.companies for all
  using (public.is_employee())
  with check (public.is_employee());

drop policy if exists "Customers read own company" on public.companies;
create policy "Customers read own company"
  on public.companies for select
  using (id = public.current_company_id());

drop policy if exists "Employees manage equipment" on public.equipment;
create policy "Employees manage equipment"
  on public.equipment for all
  using (public.is_employee())
  with check (public.is_employee());

drop policy if exists "Employees manage materials" on public.materials;
create policy "Employees manage materials"
  on public.materials for all
  using (public.is_employee())
  with check (public.is_employee());

drop policy if exists "Employees manage production_routes" on public.production_routes;
create policy "Employees manage production_routes"
  on public.production_routes for all
  using (public.is_employee())
  with check (public.is_employee());

drop policy if exists "Employees manage route_steps" on public.route_steps;
create policy "Employees manage route_steps"
  on public.route_steps for all
  using (public.is_employee())
  with check (public.is_employee());

drop policy if exists "Employees manage quotes" on public.quotes;
create policy "Employees manage quotes"
  on public.quotes for all
  using (public.is_employee())
  with check (public.is_employee());

drop policy if exists "Customers read company quotes" on public.quotes;
create policy "Customers read company quotes"
  on public.quotes for select
  using (company_id = public.current_company_id());

drop policy if exists "Employees manage schedule_jobs" on public.schedule_jobs;
create policy "Employees manage schedule_jobs"
  on public.schedule_jobs for all
  using (public.is_employee())
  with check (public.is_employee());

drop policy if exists "Customers read company schedule_jobs" on public.schedule_jobs;
create policy "Customers read company schedule_jobs"
  on public.schedule_jobs for select
  using (company_id = public.current_company_id());

drop policy if exists "Employees manage job_steps" on public.job_steps;
create policy "Employees manage job_steps"
  on public.job_steps for all
  using (public.is_employee())
  with check (public.is_employee());

drop policy if exists "Customers read company job_steps" on public.job_steps;
create policy "Customers read company job_steps"
  on public.job_steps for select
  using (
    job_id in (
      select id
      from public.schedule_jobs
      where company_id = public.current_company_id()
    )
  );
