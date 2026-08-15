-- Flexible Label Group — Material Master, Asset Registry, and closed-loop CPQ
-- Expands 001_initial.sql. Rates live in these tables; the engine never hard-codes them.

create type public.material_category as enum (
  'substrate', 'adhesive', 'laminate', 'ink', 'packaging', 'prepress'
);

create type public.asset_kind as enum (
  'press_flexo', 'press_digital', 'finishing', 'rewind', 'laminator', 'specialty'
);

create type public.estimate_status as enum (
  'draft', 'pending_approval', 'approved', 'rejected', 'ticketed'
);

create type public.approval_decision as enum ('approved', 'rejected');

create table public.materials (
  id text primary key,
  sku text unique not null,
  name text not null,
  category public.material_category not null,
  cost_per_msi numeric(10,4) not null default 0,
  cost_per_unit numeric(10,4) not null default 0,
  unit text not null default 'msi',
  waste_factor numeric(6,4) not null default 0,
  coverage_factor numeric(6,4),
  aliases text[] not null default '{}',
  recommended_for text[] not null default '{}',
  attributes jsonb not null default '{}',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.assets (
  id text primary key,
  tag text unique not null,
  name text not null,
  kind public.asset_kind not null,
  manufacturer text not null,
  model text not null,
  plant_code text not null default 'MEM-TN',
  hourly_rate numeric(10,2) not null,
  electricity_per_hour numeric(10,2) not null default 0,
  setup_minutes numeric(8,2) not null,
  setup_minutes_per_color numeric(8,2) not null default 0,
  avg_speed_fpm numeric(8,2) not null,
  max_speed_fpm numeric(8,2) not null,
  max_web_width_in numeric(8,2) not null,
  color_stations int not null default 0,
  plate_cost_per_color numeric(10,2) not null default 0,
  waste_percent numeric(6,4) not null default 0,
  capabilities text[] not null default '{}',
  gantt_resource text not null,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.rate_cards (
  id text primary key,
  plant_code text not null default 'MEM-TN',
  prepress_base numeric(10,2) not null,
  vdp_setup numeric(10,2) not null,
  vdp_per_thousand numeric(10,4) not null,
  default_labels_per_roll int not null,
  rolls_per_carton int not null,
  default_adhesive_id text references public.materials(id),
  default_ink_id text references public.materials(id),
  default_core_id text references public.materials(id),
  default_carton_id text references public.materials(id),
  updated_at timestamptz not null default now()
);

alter table public.quotes
  add column if not exists approved_at timestamptz,
  add column if not exists approved_by text,
  add column if not exists approval_reason text,
  add column if not exists job_ticket_id text;

create table public.approval_log (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.quotes(id) on delete cascade,
  decided_by text not null,
  decided_at timestamptz not null default now(),
  decision public.approval_decision not null,
  reason text not null,
  actual_margin_percent numeric(6,2) not null,
  target_margin_percent numeric(6,2) not null
);

create table public.job_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null,
  estimate_id uuid not null references public.quotes(id),
  company_id uuid not null references public.companies(id),
  spec jsonb not null,
  material_sku text not null,
  material_name text not null,
  recommended_asset_id text not null references public.assets(id),
  recommended_asset_name text not null,
  recommended_resource text not null,
  route_steps text[] not null default '{}',
  quantity int not null,
  internal_refs jsonb not null default '{}',
  scheduled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.materials enable row level security;
alter table public.assets enable row level security;
alter table public.rate_cards enable row level security;
alter table public.quotes enable row level security;
alter table public.approval_log enable row level security;
alter table public.job_tickets enable row level security;

create policy "Employees manage materials"
  on public.materials for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Employees manage assets"
  on public.assets for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Employees read rate cards"
  on public.rate_cards for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Employees manage quotes"
  on public.quotes for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Customers read own company quotes"
  on public.quotes for select
  using (
    company_id in (select company_id from public.profiles where id = auth.uid())
  );

create policy "Employees manage approval log"
  on public.approval_log for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Employees manage job tickets"
  on public.job_tickets for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));
