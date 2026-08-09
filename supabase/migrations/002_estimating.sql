-- Internal estimating (Memphis CPQ) — optional when Supabase is configured.
-- Demo mode uses data/estimates.json when Supabase env is unset.

create table if not exists public.estimates (
  id text primary key,
  customer_name text not null default '',
  product_label text not null,
  quantity integer not null,
  pricing_mode text not null default 'cost_plus',
  status text not null default 'draft'
    check (status in ('draft', 'for_estimate', 'estimating', 'sent')),
  plant_code text,
  plant_name text,
  press_name text,
  sell_price numeric not null,
  sell_price_per_m numeric not null,
  payload jsonb not null,
  claimed_by text,
  claimed_at timestamptz,
  last_actor_role text,
  share_token text unique,
  customer_response text
    check (customer_response is null or customer_response in ('accepted', 'request_changes')),
  customer_response_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimates_status_idx on public.estimates (status);
create index if not exists estimates_share_token_idx on public.estimates (share_token);

alter table public.estimates enable row level security;

create policy "Employees manage estimates"
  on public.estimates for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'employee'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'employee'
    )
  );
