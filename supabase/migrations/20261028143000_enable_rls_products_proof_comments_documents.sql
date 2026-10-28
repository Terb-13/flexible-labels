-- Enable RLS on public.products, public.proof_comments, and public.documents.
--
-- Repo audit (no .from() against these tables):
--   products — catalog is the in-memory PRODUCTS list, not this table.
--   proof_comments — portal comments are React state seeded from DEMO_PROOF_COMMENTS.
--   documents — /api/documents/parse and RFP intake parse text locally.
-- Service role is unused for all three. Anon and the browser client never touch them.
-- Signed-in server clients are unused for them too.
--
-- Access kept by these policies:
--   employees — full access via public.is_employee() (SECURITY DEFINER, migration 005)
--   customers — SELECT only, and only on company-scoped rows (quotes / job_steps pattern)
--   anon — no policy
-- products has no company_id, so customers have no tenant row to own.
-- proof_comments follow the parent proof, same as job_steps follow schedule_jobs.
-- That subquery is subject to proofs RLS. Callers who cannot select the proof
-- see no comments, which matches this app (it does not query proof_comments).
--
-- (select auth.uid()) and (select public.is_employee()) are initplans.
--
-- Reverse:
-- drop policy if exists "Employees manage products" on public.products;
-- drop policy if exists "Employees manage proof comments" on public.proof_comments;
-- drop policy if exists "Customers read own company proof comments" on public.proof_comments;
-- drop policy if exists "Employees manage documents" on public.documents;
-- drop policy if exists "Customers read own company documents" on public.documents;
-- drop index if exists public.proof_comments_proof_id_idx;
-- drop index if exists public.documents_company_id_idx;
-- alter table public.products disable row level security;
-- alter table public.proof_comments disable row level security;
-- alter table public.documents disable row level security;

alter table public.products enable row level security;
alter table public.proof_comments enable row level security;
alter table public.documents enable row level security;

create index if not exists proof_comments_proof_id_idx
  on public.proof_comments (proof_id);

create index if not exists documents_company_id_idx
  on public.documents (company_id);

drop policy if exists "Employees manage products" on public.products;
create policy "Employees manage products"
  on public.products
  for all
  to authenticated
  using ((select public.is_employee()))
  with check ((select public.is_employee()));

drop policy if exists "Employees manage proof comments" on public.proof_comments;
create policy "Employees manage proof comments"
  on public.proof_comments
  for all
  to authenticated
  using ((select public.is_employee()))
  with check ((select public.is_employee()));

drop policy if exists "Customers read own company proof comments" on public.proof_comments;
create policy "Customers read own company proof comments"
  on public.proof_comments
  for select
  to authenticated
  using (
    proof_id in (
      select id
      from public.proofs
      where company_id in (
        select company_id
        from public.profiles
        where id = (select auth.uid())
      )
    )
  );

drop policy if exists "Employees manage documents" on public.documents;
create policy "Employees manage documents"
  on public.documents
  for all
  to authenticated
  using ((select public.is_employee()))
  with check ((select public.is_employee()));

drop policy if exists "Customers read own company documents" on public.documents;
create policy "Customers read own company documents"
  on public.documents
  for select
  to authenticated
  using (
    company_id in (
      select company_id
      from public.profiles
      where id = (select auth.uid())
    )
  );
