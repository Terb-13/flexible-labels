-- Flexible Label Group — Supabase schema
-- Run in Supabase SQL editor or via CLI: supabase db push

create type public.user_role as enum ('customer', 'employee');
create type public.invoice_status as enum ('Pending', 'Paid', 'Overdue');
create type public.quote_status as enum ('draft', 'pending_approval', 'approved', 'sent');

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  margin_percent numeric(5,2) not null default 32,
  target_margin_percent numeric(5,2) not null default 28,
  is_reseller boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null default 'customer',
  company_id uuid references public.companies(id),
  job_title text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category_label text not null,
  description text not null,
  tags text[] not null default '{}',
  ideal_for text not null,
  image_url text not null,
  ai_prompt text not null,
  sort_order int not null default 0
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  company_id uuid not null references public.companies(id),
  description text not null,
  quantity int not null,
  status text not null,
  ship_by text,
  progress int not null default 0 check (progress between 0 and 100),
  total_amount numeric(10,2),
  completed_at date,
  created_at timestamptz not null default now()
);

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  company_id uuid not null references public.companies(id),
  amount numeric(10,2) not null,
  issued_at date not null,
  due_at date not null,
  status public.invoice_status not null default 'Pending'
);

create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  title text not null,
  brand text not null,
  product_name text not null,
  proof_number text not null,
  material text not null,
  status text not null default 'Awaiting your review',
  image_url text not null,
  created_at timestamptz not null default now()
);

create table public.proof_comments (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references public.proofs(id) on delete cascade,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.schedule_jobs (
  id uuid primary key default gen_random_uuid(),
  job_number text unique not null,
  company_id uuid references public.companies(id),
  name text not null,
  quantity text not null,
  resource text not null,
  start_day int not null default 0,
  duration int not null default 1,
  due_date text not null,
  material text not null
);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id),
  created_by uuid references public.profiles(id),
  spec jsonb not null,
  breakdown jsonb not null,
  status public.quote_status not null default 'draft',
  needs_approval boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  uploaded_by uuid references public.profiles(id),
  file_path text not null,
  parsed_spec jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.invoices enable row level security;
alter table public.proofs enable row level security;

create policy "Employees read all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'employee'
    )
  );

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Customers read company orders"
  on public.orders for select
  using (
    company_id in (
      select company_id from public.profiles where id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'employee'
    )
  );

-- Storage bucket for artwork uploads (create in Supabase dashboard)
-- insert into storage.buckets (id, name, public) values ('artwork', 'artwork', false);
