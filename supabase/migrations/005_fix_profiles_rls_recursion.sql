-- Break the profiles RLS self-select that recurses on employee GET /profiles.
-- Matches live project fevxxyiquebenlqhpktu migration fix_profiles_rls_recursion.
-- SECURITY DEFINER reads public.profiles as the owner, so this helper is not
-- re-checked by "Employees read all profiles". Replay after 001; do not rewrite 001.

create or replace function public.is_employee()
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'employee'
  );
$$;

drop policy if exists "Employees read all profiles" on public.profiles;

create policy "Employees read all profiles"
  on public.profiles for select
  using (is_employee());
