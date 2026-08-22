-- CPQ wizard: persist quantity breaks + grouped family-run flag.
-- Pricing still goes through calculateQuote (EXAMPLE catalog rates only).
-- Extra spec fields (shape, unwind, finishes, etc.) live on quotes.spec jsonb
-- until they have a real catalog rate — do not invent plant dollars here.

alter table public.quotes
  add column if not exists qty_breaks jsonb not null default '[]'::jsonb,
  add column if not exists grouped boolean not null default false;

comment on column public.quotes.qty_breaks is
  'Quantity breaks captured by the estimate wizard. Priced via calculateQuote; EXAMPLE rates only.';
comment on column public.quotes.grouped is
  'When true, breaks are summed for one family-run calculateQuote call.';

create index if not exists quotes_created_at_idx on public.quotes (created_at desc);
