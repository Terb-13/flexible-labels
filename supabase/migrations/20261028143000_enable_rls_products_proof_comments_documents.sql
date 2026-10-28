-- App never reads these tables; service role bypasses RLS.
-- Reverse: alter table public.products disable row level security; alter table public.proof_comments disable row level security; alter table public.documents disable row level security.

alter table public.products enable row level security;
alter table public.proof_comments enable row level security;
alter table public.documents enable row level security;
