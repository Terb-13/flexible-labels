# Flexible Label Group

Next.js 15 app for the Flexible Label marketing site, customer portal, and a light operations estimating loop. Live site: [flexible-labels.vercel.app](https://flexible-labels.vercel.app). Existing vendors only: **Vercel + Supabase**.

## Two login doors

| URL | Who | Lands on |
| --- | --- | --- |
| `/portal/login` | Customers only | `/portal` |
| `/operations/login` | Employees only | `/operations` |

Customers never see an Operations control on the customer login page, marketing nav, or portal. A customer session that hits `/operations` or `/operations/login` is sent back to `/portal` with no employee language.

Production auth is **Supabase Auth + `profiles.role`**. Create a `profiles` row with `role = 'customer'` or `role = 'employee'` for each auth user.

A sample-account bypass is **local only**. It never appears on Vercel production or preview. Set `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true` only on a private machine if you need it. The button reads “Sample account — won’t affect real orders.”

## Estimating loop

1. Employee signs in at `/operations/login`.
2. Pick the **buyer customer** first (the account the quote is for — not a plant; there is one plant). Add one if needed (`name`, type via `is_reseller`, margin, discount). There is no `customers` table.
3. Two estimator doors, same `calculateQuote` engine:
   - **Operations (employee):** pick the buyer customer, then walk Product → Material → Size → Colors → Specs → Quantity → Estimate. Last step shows margin, cost stack, and the auto-chosen production route (press → finish → ship). No plant/site picker.
   - **Customer (`/quote` guest + `/portal`):** Product → Material → Size → Colors → Quantity → sell price. Guests skip the EXAMPLE customer dropdown and price under standard DTC terms. Logged-in portal stays locked to that customer record. Public calculate responses are sell price only.
4. `POST /api/quotes/calculate` still calls `calculateQuote` (once per break, or once on the summed qty when “Group these together” is on). Employee callers get the full stack. Customer callers get sell prices only. It matches a production route (`printer → seamer → finisher → shipping`), qualifies equipment, and cost-plus prices from:
   - equipment: `cost_rate`, `run_speed`, `waste_percent`, `setup_time_minutes`
   - materials: substrate + dye
   - company: `is_reseller`, `margin_percent`, `target_margin_percent`, `discount_percent`
5. Save quote → approve if below target margin → **Generate job ticket** writes `orders`, `schedule_jobs`, and `job_steps`.
6. Press time uses lineal feet and EXAMPLE FPM, not label-count / unitless speed:
   - `production_feet = (quantity / across) * (repeat_in / 12)`
   - `planned_press_hours = setup_time_minutes/60 + production_feet / run_speed_fpm`
7. Job windows snap to the EXAMPLE Mon–Fri plant shift and do not overlap another block on the same press.
8. Employees clock setup / run / delay on `/operations`. One open clock per press. Delay requires a reason. The owner board shows ON PRESS NOW plus planned vs actual and delay hours.

## EXAMPLE rates

Seeded machine and material numbers are **EXAMPLE**. They are not Flexible Label’s real plant rates. Replace them in Supabase before treating quotes as production numbers.

```bash
npm run db:seed
```

`scripts/seed-demo.ts` upserts one DTC company, one reseller company, EXAMPLE presses/seamer/finisher/shipping, EXAMPLE substrates + dye, and three production routes.

## Schema

- `supabase/migrations/001_initial.sql` — companies, profiles, orders, quotes, schedule_jobs
- `supabase/migrations/002_erp_estimating.sql` — `discount_percent`, equipment, materials, production_routes, route_steps, job_steps, quote↔order links, calendar columns on `schedule_jobs`
- `supabase/migrations/003_press_floor.sql` — `run_speed_unit` / `run_speed_fpm`, quote/job `repeat_in` + `across` + `production_feet`, `delay_reasons`, `shop_floor_clocks`, `plant_shifts`
- `supabase/migrations/004_cpq_qty_breaks.sql` — `quotes.qty_breaks` + `quotes.grouped` (wizard capture; still priced by `calculateQuote`)

Apply 002 (already in production) then **003** and **004**. Do not rewrite or re-apply 001/002.

Press-floor v1 is a shop-floor scheduler + operator clocks. Out of scope: JDF/press-counter hookup, changeover optimizer, inventory/material holds, payroll, multi-plant, auto-reschedule of the whole plant, invented plant dollars, buyer email.

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Without Supabase keys, calculate uses the EXAMPLE catalog and quote/job writes stay in the local process so the estimator → Gantt loop can be previewed.

```bash
npm run verify:erp
npm run verify:floor
npm run verify:cpq
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
