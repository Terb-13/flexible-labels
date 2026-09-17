# Summit Graphics — Sirvoce estimator demo

Next.js 15 app for **Summit Graphics**: marketing site, **self-serve customer quote door**, customer portal, and a light operations estimating loop.

Intended GitHub repo: [https://github.com/Terb-13/summit-graphics](https://github.com/Terb-13/summit-graphics)

Live brochure (call-only, buyer UAT fail): [summitgraphics.org](https://summitgraphics.org). This demo adds the missing quote door.

Patterned from [Terb-13/flexible-labels](https://github.com/Terb-13/flexible-labels) two-door architecture. **Vendors: Vercel + Supabase only.** No Clerk. No Stripe.

## Two login doors

| URL | Who | Lands on |
| --- | --- | --- |
| `/portal/login` | Customers only | `/portal` |
| `/operations/login` | Employees only | `/operations` |

Customers never see an Operations control on the customer login page, marketing nav, or portal. A customer session that hits `/operations` or `/operations/login` is sent back to `/portal` with no employee language.

Production auth is **Supabase Auth + `profiles.role`**. Create a `profiles` row with `role = 'customer'` or `role = 'employee'` for each auth user. Sign-in is email and password only.

## Estimating loop

1. Employee signs in at `/operations/login`.
2. Pick the **buyer customer** first (the account the quote is for — one plant, no plant picker).
3. Two estimator doors, same `calculateQuote` engine:
   - **Operations (employee):** buyer → Product → Material → Size → Colors → Specs → Quantity → Estimate. Last step shows margin, cost stack, and the auto-chosen production route.
   - **Customer (`/quote` guest + `/portal`):** Product → Material → Size → Colors → Quantity → **sell price only**. Guests price under standard DTC terms. Logged-in portal stays locked to that customer. Public calculate responses are sell price only.
4. `POST /api/quotes/calculate` calls `calculateQuote`. Employee callers get the full stack. Customer callers get sell prices only.
5. Save quote → approve if below target margin → **Generate job ticket** writes `orders`, `schedule_jobs`, and `job_steps`.

Labels use **process = route**. Packaging/kits, signs, decals, and electronic/serialized have their own EXAMPLE routes.

## EXAMPLE rates — not Summit plant dollars

Seeded machine and material numbers are **EXAMPLE engine stubs**. They are **not** Summit Graphics plant rates and they are **not** copied Flexible Label figures. Replace them in Supabase before treating quotes as production numbers.

```bash
npm run db:seed
```

`scripts/seed-demo.ts` upserts two EXAMPLE buyer companies, EXAMPLE equipment (label / wide-format / carton / decal / serialized / kit / die / ship), EXAMPLE materials (including die / tool / other templates), product→equipment map stubs, and per-type routes.

## Schema

- `supabase/migrations/001_initial.sql` — companies, profiles, orders, quotes, schedule_jobs
- `supabase/migrations/002_erp_estimating.sql` — equipment, materials, production_routes, route_steps, job_steps
- `supabase/migrations/003_press_floor.sql` — FPM / clocks / plant shifts
- `supabase/migrations/004_cpq_qty_breaks.sql` — qty breaks
- `supabase/migrations/005_fix_profiles_rls_recursion.sql` — `public.is_employee()`
- `supabase/migrations/006_summit_material_kinds.sql` — `die` / `tool` / `other` material kinds

Out of scope: inventory, PO, GL, VMI, payroll, Clerk, Stripe, invented plant dollars.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Without Supabase keys, calculate uses the EXAMPLE catalog and quote/job writes stay in the local process.

```bash
npm run verify:erp
npm run verify:floor
npm run verify:cpq
npm run lint
npm run build
```

## Environment

See `.env.example`. Required for live auth and persistence:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Optional AI keys are unused by the rule-based RFP parser. Do not commit secrets.
