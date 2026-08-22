-- EXAMPLE-only seed for local / preview databases.
-- Every business name includes EXAMPLE. Rates are invented placeholders —
-- not Flexible Label production rates. Do not seed live customer names.
-- Applied by `supabase db reset`. App seed: `npm run db:seed`.

insert into public.companies (
  id, name, margin_percent, target_margin_percent, is_reseller, discount_percent
) values
  (
    '10000000-0000-4000-8000-000000000001',
    'EXAMPLE Reseller Co',
    18, 22, true, 5
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'EXAMPLE DTC Company',
    32, 28, false, 0
  )
on conflict (id) do update set
  name = excluded.name,
  margin_percent = excluded.margin_percent,
  target_margin_percent = excluded.target_margin_percent,
  is_reseller = excluded.is_reseller,
  discount_percent = excluded.discount_percent;

insert into public.equipment (
  id, name, type, cost_rate, run_speed, waste_percent, setup_time_minutes, capabilities, sort_order
) values
  (
    '20000000-0000-4000-8000-000000000001',
    'EXAMPLE Printer Line',
    'printer', 45, 120, 4, 30,
    '{"note":"EXAMPLE placeholder rate — not an FLG production rate"}'::jsonb,
    10
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'EXAMPLE Seamer Line',
    'seamer', 28, 90, 2, 15,
    '{"note":"EXAMPLE placeholder rate — not an FLG production rate"}'::jsonb,
    20
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'EXAMPLE Finisher Line',
    'finisher', 22, 80, 3, 20,
    '{"note":"EXAMPLE placeholder rate — not an FLG production rate"}'::jsonb,
    30
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'EXAMPLE Shipping Lane',
    'shipping', 18, 60, 0, 10,
    '{"note":"EXAMPLE placeholder rate — not an FLG production rate"}'::jsonb,
    40
  )
on conflict (id) do update set
  name = excluded.name,
  type = excluded.type,
  cost_rate = excluded.cost_rate,
  run_speed = excluded.run_speed,
  waste_percent = excluded.waste_percent,
  setup_time_minutes = excluded.setup_time_minutes,
  capabilities = excluded.capabilities,
  sort_order = excluded.sort_order;

insert into public.materials (id, name, kind, cost_per_sqin, notes) values
  (
    '30000000-0000-4000-8000-000000000001',
    'EXAMPLE White BOPP Substrate',
    'substrate', 0.012,
    'EXAMPLE placeholder cost_per_sqin — not a Flexible Label production rate.'
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    'EXAMPLE Kraft Paper Substrate',
    'substrate', 0.009,
    'EXAMPLE placeholder cost_per_sqin — not a Flexible Label production rate.'
  ),
  (
    '30000000-0000-4000-8000-000000000003',
    'EXAMPLE Process Dye',
    'dye', 0.003,
    'EXAMPLE placeholder cost_per_sqin — not a Flexible Label production rate.'
  )
on conflict (id) do update set
  name = excluded.name,
  kind = excluded.kind,
  cost_per_sqin = excluded.cost_per_sqin,
  notes = excluded.notes;

insert into public.production_routes (id, name, match) values
  (
    '40000000-0000-4000-8000-000000000001',
    'EXAMPLE Standard Production Route',
    '{"product":"roll-labels","type":"flexo","material":"bopp","specs":{}}'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  match = excluded.match;

insert into public.route_steps (id, route_id, step_order, equipment_type, equipment_id) values
  (
    '50000000-0000-4000-8000-000000000001',
    '40000000-0000-4000-8000-000000000001',
    1, 'printer', '20000000-0000-4000-8000-000000000001'
  ),
  (
    '50000000-0000-4000-8000-000000000002',
    '40000000-0000-4000-8000-000000000001',
    2, 'seamer', '20000000-0000-4000-8000-000000000002'
  ),
  (
    '50000000-0000-4000-8000-000000000003',
    '40000000-0000-4000-8000-000000000001',
    3, 'finisher', '20000000-0000-4000-8000-000000000003'
  ),
  (
    '50000000-0000-4000-8000-000000000004',
    '40000000-0000-4000-8000-000000000001',
    4, 'shipping', '20000000-0000-4000-8000-000000000004'
  )
on conflict (id) do update set
  route_id = excluded.route_id,
  step_order = excluded.step_order,
  equipment_type = excluded.equipment_type,
  equipment_id = excluded.equipment_id;
