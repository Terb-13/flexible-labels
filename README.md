# Flexible Label Group

Next.js 15 app for the Flexible Label marketing site, customer portal, and a light operations estimating loop. Live site: [flexible-labels.vercel.app](https://flexible-labels.vercel.app). Existing vendors only: **Vercel + Supabase**.

## Two login doors

| URL | Who | Lands on |
| --- | --- | --- |
| `/portal/login` | Customers only | `/portal` |
| `/operations/login` | Employees only | `/operations` |

Customers never see an Operations control on the customer login page, marketing nav, or portal. A customer session that hits `/operations` is sent back to `/portal`.

Production auth is **Supabase Auth + `profiles.role`**. Create a `profiles` row with `role = 'customer'` or `role = 'employee'` for each auth user.

A demo cookie is available for **local preview only** (when Supabase is not configured, or `NODE_ENV !== production`, or `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`). It is not the production path.

## Estimating loop

1. Employee signs in at `/operations/login`.
2. Pick an existing **company** or add one (`name`, type via `is_reseller`, margin, discount). There is no `customers` table.
3. Enter **product attributes only**: product, type, material, specs. No reseller/DTC toggle and no discount field on the estimate.
4. `POST /api/quotes/calculate` matches a production route (`printer → seamer → finisher → shipping`), qualifies equipment, and cost-plus prices from:
   - equipment: `cost_rate`, `run_speed`, `waste_percent`, `setup_time_minutes`
   - materials: substrate + dye
   - company: `is_reseller`, `margin_percent`, `target_margin_percent`, `discount_percent`
5. Save quote → approve if below target margin → **Generate job ticket** writes `orders`, `schedule_jobs`, and `job_steps`.
6. The Gantt reads `schedule_jobs` + `job_steps` on a real calendar (`started_at` / `ended_at`). Plant list reads `equipment`.

## EXAMPLE rates

Seeded machine and material numbers are **EXAMPLE**. They are not Flexible Label’s real plant rates. Replace them in Supabase before treating quotes as production numbers.

```bash
npm run db:seed
```

`scripts/seed-demo.ts` upserts one DTC company, one reseller company, EXAMPLE presses/seamer/finisher/shipping, EXAMPLE substrates + dye, and three production routes.

## Schema

- `supabase/migrations/001_initial.sql` — companies, profiles, orders, quotes, schedule_jobs
- `supabase/migrations/002_erp_estimating.sql` — `discount_percent`, equipment, materials, production_routes, route_steps, job_steps, quote↔order links, calendar columns on `schedule_jobs`

Apply 002 on the live Supabase project (CIO) so the repo and database match.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Without Supabase keys, calculate uses the EXAMPLE catalog and quote/job writes stay in the local process so the estimator → Gantt loop can be previewed.

```bash
npm run verify:erp
npm run lint
npm run build
```

## Environment

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=   # optional; local preview cookie in production
```
