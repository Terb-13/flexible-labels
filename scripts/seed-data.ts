/**
 * EXAMPLE-only demo seed. Every business label includes "EXAMPLE".
 * Rates are invented placeholders — not Flexible Label production rates.
 * Do not seed live customer names.
 */

export const EXAMPLE_LABEL = "EXAMPLE";

export const SEED_COMPANIES = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "EXAMPLE Reseller Co",
    margin_percent: 18,
    target_margin_percent: 22,
    is_reseller: true,
    discount_percent: 5,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "EXAMPLE DTC Company",
    margin_percent: 32,
    target_margin_percent: 28,
    is_reseller: false,
    discount_percent: 0,
  },
] as const;

export const SEED_EQUIPMENT = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    name: "EXAMPLE Printer Line",
    type: "printer",
    cost_rate: 45,
    run_speed: 120,
    waste_percent: 4,
    setup_time_minutes: 30,
    capabilities: { note: "EXAMPLE placeholder rate — not an FLG production rate" },
    sort_order: 10,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    name: "EXAMPLE Seamer Line",
    type: "seamer",
    cost_rate: 28,
    run_speed: 90,
    waste_percent: 2,
    setup_time_minutes: 15,
    capabilities: { note: "EXAMPLE placeholder rate — not an FLG production rate" },
    sort_order: 20,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    name: "EXAMPLE Finisher Line",
    type: "finisher",
    cost_rate: 22,
    run_speed: 80,
    waste_percent: 3,
    setup_time_minutes: 20,
    capabilities: { note: "EXAMPLE placeholder rate — not an FLG production rate" },
    sort_order: 30,
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    name: "EXAMPLE Shipping Lane",
    type: "shipping",
    cost_rate: 18,
    run_speed: 60,
    waste_percent: 0,
    setup_time_minutes: 10,
    capabilities: { note: "EXAMPLE placeholder rate — not an FLG production rate" },
    sort_order: 40,
  },
] as const;

export const SEED_MATERIALS = [
  {
    id: "30000000-0000-4000-8000-000000000001",
    name: "EXAMPLE White BOPP Substrate",
    kind: "substrate",
    cost_per_sqin: 0.012,
    notes: "EXAMPLE placeholder cost_per_sqin — not a Flexible Label production rate.",
  },
  {
    id: "30000000-0000-4000-8000-000000000002",
    name: "EXAMPLE Kraft Paper Substrate",
    kind: "substrate",
    cost_per_sqin: 0.009,
    notes: "EXAMPLE placeholder cost_per_sqin — not a Flexible Label production rate.",
  },
  {
    id: "30000000-0000-4000-8000-000000000003",
    name: "EXAMPLE Process Dye",
    kind: "dye",
    cost_per_sqin: 0.003,
    notes: "EXAMPLE placeholder cost_per_sqin — not a Flexible Label production rate.",
  },
] as const;

export const SEED_ROUTE = {
  id: "40000000-0000-4000-8000-000000000001",
  name: "EXAMPLE Standard Production Route",
  match: {
    product: "roll-labels",
    type: "flexo",
    material: "bopp",
    specs: {},
  },
} as const;

export const SEED_ROUTE_STEPS = [
  {
    id: "50000000-0000-4000-8000-000000000001",
    route_id: SEED_ROUTE.id,
    step_order: 1,
    equipment_type: "printer",
    equipment_id: SEED_EQUIPMENT[0].id,
  },
  {
    id: "50000000-0000-4000-8000-000000000002",
    route_id: SEED_ROUTE.id,
    step_order: 2,
    equipment_type: "seamer",
    equipment_id: SEED_EQUIPMENT[1].id,
  },
  {
    id: "50000000-0000-4000-8000-000000000003",
    route_id: SEED_ROUTE.id,
    step_order: 3,
    equipment_type: "finisher",
    equipment_id: SEED_EQUIPMENT[2].id,
  },
  {
    id: "50000000-0000-4000-8000-000000000004",
    route_id: SEED_ROUTE.id,
    step_order: 4,
    equipment_type: "shipping",
    equipment_id: SEED_EQUIPMENT[3].id,
  },
] as const;

export function assertExampleOnlyLabels(labels: readonly string[]) {
  const forbidden = [
    "acme",
    "apex brewing",
    "horizon foods",
    "pinnacle",
    "metro fleet",
    "summit pharma",
    "titan logistics",
    "delta chem",
  ];
  for (const label of labels) {
    if (!label.includes(EXAMPLE_LABEL)) {
      throw new Error(`Seed label must include EXAMPLE: ${label}`);
    }
    const lower = label.toLowerCase();
    for (const name of forbidden) {
      if (lower.includes(name)) {
        throw new Error(`Do not seed live/demo customer names: ${label}`);
      }
    }
  }
}

export function allSeedBusinessLabels(): string[] {
  return [
    ...SEED_COMPANIES.map((row) => row.name),
    ...SEED_EQUIPMENT.map((row) => row.name),
    ...SEED_MATERIALS.map((row) => row.name),
    SEED_ROUTE.name,
  ];
}
