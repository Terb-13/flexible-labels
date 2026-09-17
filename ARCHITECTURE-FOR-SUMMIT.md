# Architecture for a Summit Graphics clone

Read-only brief of **Flexible Label Group** (`Terb-13/flexible-labels`) as it ships today. Use this to clone the **two-door + cost-plus estimator + light ERP** pattern for **Summit Graphics** (packaging / labels / signs; telecom packaging, cartons, signs, VMI claims).

This file describes the Flexible Label demo. It does **not** publish plant dollars or machine rates. Seeded numbers in `src/lib/data/example-catalog.ts` and `scripts/seed-demo.ts` are **EXAMPLE placeholders**, not Flexible Label (and not Summit) costs. Do not copy those figures into a Summit quote engine.

Live FL demo: [flexible-labels.vercel.app](https://flexible-labels.vercel.app). Repo HEAD at write time: `main` @ `a0a9a2e`.

---

## 1. Customer door vs Operations door

Two login URLs. Two roles. No shared “pick your portal” control.

| Door | URL | Who | Lands on |
| --- | --- | --- | --- |
| Customer | `/portal/login` | `profiles.role = 'customer'` | `/portal` |
| Operations | `/operations/login` | `profiles.role = 'employee'` | `/operations` |

Auth is **Supabase Auth (email + password) + `profiles.role`**. There is no Clerk, no demo-login bypass, no magic-link in production. A `profiles` row must exist for each auth user. `loginWithPassword(door, …)` signs in, then **rejects and signs out** if `profile.role !== door` (“This portal is for customers.” / “This sign-in is for employees.”).

### Middleware (`src/lib/supabase/middleware.ts`)

- `/operations/*` (except login): employee only. Customer session → `/portal`. Unauthenticated → `/operations/login?next=…`.
- `/portal/*` (except login): any signed-in role. Unauthenticated → `/portal/login?next=…`.
- `/operations/login` + customer session → `/portal` with **no employee language**.
- `/operations/login` + employee session → `/operations`.
- `/portal/login` + customer session → `/portal`.

`/portal/estimator` additionally redirects employees to `/operations`.

### What each door sees

**Marketing** (`(marketing)`: `/`, `/products`, `/quote`, `/contact`, `/about`, `/capabilities`):

- Header: Logo, Products, **Get a quote**, **Sign in** → `/portal/login` only.
- Customers never see an Operations control on the marketing nav, customer login, or portal.

**Customer door:**

- `/portal` — proofs, order tracking, invoice list, quote highlight. Tenant-scoped to `profile.company_id`.
- `/portal/estimator` — sell-price wizard, locked to that customer’s company.
- `/quote` — same public wizard (guest or logged-in customer). Guests skip the buyer picker and price under **standard DTC terms**. Logged-in customers stay locked to their company.
- Public calculate responses and the last wizard step show **sell price only**.
- Customer materials picker is **names only** (no `cost_per_sqin`, notes, or equipment catalog).

**Operations door (`/operations`):**

- Buyer picker (company = customer account; **one plant**, no plant/site picker).
- Full CPQ wizard including Specs, cost stack, margin, auto-chosen route, footage / planned press hours.
- RFP paste / document parse (employee only).
- Estimate queue → approve if below target margin → **Generate job ticket**.
- Press Gantt, operator clocks (setup / run / delay), ON PRESS NOW, owner delay board.

There is **no `customers` table**. Buyers are `companies` (`name`, `is_reseller`, `margin_percent`, `target_margin_percent`, `discount_percent`).

### Two-door rules to keep when cloning

1. Separate login URLs. Do not put an Operations link on marketing, `/portal/login`, or `/portal`.
2. A customer session that hits `/operations` or `/operations/login` goes to `/portal` with no employee copy.
3. Wrong-role sign-in at a door signs out.
4. Non-employee `POST /api/quotes/calculate` returns `toPublicCalculateResponse` (sell prices only).
5. Customer UI never shows cost buckets, route, FPM, margin, or equipment rates.
6. Pick the **buyer company**, not a plant.

---

## 2. Estimator: attributes → routing → cost-plus → quote/job

Same engine: `calculateQuote` / `calculateQuoteBreaks` in `src/lib/pricing/engine.ts`. Two wizards, one API.

```
attributes (product, type, material, size, colors, qty, …)
    → matchRoute (production_routes.match_attributes)
    → qualifyEquipment per stage (capabilities + cheapest cost_rate)
    → cost-plus (materials + timed stages + company margin/discount)
    → quote row → (employee) approve if needed → job ticket
```

### Wizard steps

| Step | Employee | Customer / guest |
| --- | --- | --- |
| Product | yes | yes |
| Material | yes | yes (names only) |
| Size | yes | yes |
| Colors | yes | yes |
| Specs | yes | **skipped** |
| Quantity (up to 7 breaks; optional “Group these together”) | yes | yes |
| Estimate | full stack + route + job actions | sell price + save / checkout |

`across` is **engine-chosen** (`withAutoAcross`). A stale client value is not a lock. Press hours need `repeatIn` and `across`.

### Pricing math (structure only — rates are EXAMPLE until replaced)

- Substrate: `width × height × qty × (1 + press waste%) × cost_per_sqin`
- Dye: `cost_per_unit × stations × qty / 1000`
- Press hours: `production_feet = (qty / across) × (repeat_in / 12)` then `setup/60 + feet / run_speed_fpm`
- Other stages: `setup/60 + (qty / run_speed) × (1 + waste%)` (labels/hour)
- `list = totalCost × (1 + margin%)`; `sell = list × (1 − discount%)`
- `needsApproval` when actual margin % &lt; `target_margin_percent`

Routes score on product / type / material / min–max qty, else default route. Seeded EXAMPLE routes: Digital short-run, Flexo production, Standard plant route. Stages: `printer → seamer → finisher → shipping`.

### Tables and modules

| Layer | Where |
| --- | --- |
| Types | `src/types/index.ts` |
| Engine | `src/lib/pricing/engine.ts`, `catalog.ts`, `sell-price.ts`, `materials.ts`, `artwork-colors.ts` |
| EXAMPLE fallback | `src/lib/data/example-catalog.ts` |
| Persist / jobs | `src/lib/erp/store.ts` |
| Press time | `src/lib/erp/press-time.ts` |
| Calendar | `src/lib/erp/shifts.ts`, `calendar.ts` |
| Clocks / board | `src/lib/erp/clocks.ts`, `report.ts` |
| Calculate API | `src/app/api/quotes/calculate/route.ts` |
| Employee writes | `src/app/operations/actions.ts` |
| Public writes | `src/app/quote/actions.ts` |
| UI | `src/components/estimator/*`, `portal/estimator-workspace.tsx` |

**Schema (migrations, additive — do not rewrite 001/002):**

- `001_initial.sql` — `companies`, `profiles`, `products`, `orders`, `invoices`, `proofs`, `proof_comments`, `schedule_jobs`, `quotes`, `documents`
- `002_erp_estimating.sql` — `discount_percent`, `equipment`, `materials`, `production_routes`, `route_steps`, `job_steps`, quote↔order links, calendar columns
- `003_press_floor.sql` — `run_speed_unit` / `run_speed_fpm`, `repeat_in` / `across` / `production_feet`, `delay_reasons`, `shop_floor_clocks`, `plant_shifts`
- `004_cpq_qty_breaks.sql` — `quotes.qty_breaks`, `quotes.grouped`
- `005_fix_profiles_rls_recursion.sql` — `public.is_employee()`

### EXAMPLE vs real

`catalog.source` is `"example"` or `"supabase"`. If Supabase is missing or equipment is empty, the engine uses `EXAMPLE_CATALOG`. Empty materials/routes with live equipment are filled from EXAMPLE — **no invented stocks or rates**.

`npm run db:seed` upserts one DTC company, one reseller, EXAMPLE presses/seamer/finisher/shipping, EXAMPLE substrates + dye, three routes, EXAMPLE delay codes, EXAMPLE Mon–Fri 07:00–15:00 shifts.

**Do not treat seeded `cost_rate`, FPM, or substrate cents as production numbers.** Replace them in Supabase with Summit-provided rates before any customer-facing quote is “real.” Extra spec fields (foil, RFID, unwind, etc.) live on `quotes.spec` jsonb until they have a catalog rate.

Without Supabase keys, calculate uses EXAMPLE catalog and quote/job writes stay in-process (`src/lib/data/local-store.ts`).

---

## 3. Light ERP v1 — in vs out

**In (shop-floor scheduler + operator clocks, not a full APS):**

- Equipment and materials catalog
- Production routes + job steps
- Quotes → `orders` + `schedule_jobs` + `job_steps` on **Generate job ticket** (quote must be `approved`)
- Gantt: job windows snap to plant shifts; no overlap on the same press
- One **open clock per press**; delay requires a reason
- Owner board: ON PRESS NOW, planned vs actual, delay hours
- Buyer companies (DTC vs reseller terms)
- Tenant-scoped customer portal (orders / invoices / proofs / own quotes)

**Explicitly out:**

- Inventory / material holds / stock
- Purchase orders
- General ledger / accounting
- Payroll
- JDF / press-counter hookup
- Changeover optimizer
- Multi-plant
- Auto-reschedule of the whole plant
- Invented plant dollars
- Buyer email / outbound notifications
- Stripe (or any card rail) — portal “Pay” is **client-side demo state**; checkout saves a quote, it does not charge
- VMI / claims / consignment

`invoices` and `proofs` tables exist; much of the portal proof/pay UX is still **demo fixtures** (`src/lib/data/demo-data.ts`) when the live tables are empty.

---

## 4. Stack

| Piece | What this repo actually uses |
| --- | --- |
| App | Next.js 15 App Router, React 19, TypeScript, Turbopack |
| Host | Vercel (`vercel.json` → Next.js). Live: `flexible-labels.vercel.app` |
| DB / Auth | **Supabase only** — Postgres, RLS, Auth email/password. Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| UI | Tailwind CSS 4, Radix primitives, lucide |
| Validation | Zod |
| AI (optional) | `ai` SDK; `.env.example` has `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `XAI_API_KEY`. RFP parse is **rule-based** without keys. Chat is a demo responder. |
| **Not present** | Clerk, Stripe, Shopify, Vercel Postgres/KV, a separate `customers` table |

Vendors the README allows: **Vercel + Supabase**. Keep that unless Summit explicitly adds a rail.

---

## 5. Reusable vs Summit-specific

### Reuse as-is (pattern)

- Two-door routes, middleware, `profiles.role`, door login, sell-price vs full-stack split
- `companies` as buyer accounts (DTC / reseller / margin / discount)
- Attribute match → route → qualify equipment → cost-plus → quote → approve → job ticket → Gantt → clocks
- EXAMPLE catalog fallback + “do not invent rates” discipline
- RLS shape: employees manage; customers read own `company_id`
- Marketing + `/quote` + `/portal` + `/operations` app split
- Qty breaks / grouped family run (CPQ capture; still one engine)
- Local-store preview when keys are missing
- Verify scripts: `npm run verify:erp`, `verify:floor`, `verify:cpq`

### Must be Summit-specific (do not copy FL catalog)

Flexible Label’s demo is **narrow-web labels / stickers** (Memphis, EST 1951). Product list: Roll Labels, Die-Cut Stickers, Bumper Stickers, Magnets, Packaging Tape, Foil, Variable Data, Parking Decals. Equipment stages and press-time math assume **web converting** (across, repeat inches, lineal feet, FPM).

Summit needs its own, **after they provide rates and process** — do not invent:

| Summit need | Why FL does not cover it |
| --- | --- |
| Telecom packaging | No kit / foam / bag / insert BOM. Materials are label substrates. |
| Cartons | No corrugated, die, glue, or folding stages. Stages are printer/seamer/finisher/shipping. |
| Signs | No wide-format / rigid / install workflow. Size model is label inches + web width. |
| VMI / claims | No consignment, replenishment, or claim objects. Out of ERP v1. |
| Brand / copy | FLG Memphis marketing, FL product photos, Acme/Print Partners EXAMPLE buyers. |
| Press-time model | Footage/FPM is wrong for sheet-fed carton or wide-format sign unless Summit says that is how they cost. |

`demo-data.ts` includes a fixture tenant **“Summit Pharma Tamper Vials”**. That is **not** Summit Graphics. Do not reuse it as the prospect account.

### Suggested clone sequence (no rates until Summit gives them)

1. New app / tenant: same two doors, new brand, empty EXAMPLE catalog labeled as such.
2. Summit product taxonomy + stages (packaging vs carton vs sign may be **different routes**, not one FL press line).
3. Buyer companies + roles only — still one plant unless they have more than one.
4. Drop EXAMPLE rates; refuse to quote as production until catalog rows are real.
5. Keep inventory, PO, GL, VMI **out** until a later ERP slice.

---

## Pointers

- Operator summary: `README.md`
- Seed: `npm run db:seed`
- Local: `cp .env.example .env.local && npm install && npm run dev`
