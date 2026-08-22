import type {
  Company,
  Equipment,
  Material,
  PricingCatalog,
  ProductionRoute,
} from "@/types";

/**
 * EXAMPLE rates for local preview and first seed.
 * These are not Flexible Label’s real machine or material costs.
 */
export const EXAMPLE_RATE_DISCLAIMER =
  "EXAMPLE rate — not a published Flexible Label machine or material cost.";

export const EXAMPLE_DTC_COMPANY: Company = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Acme Brands",
  margin_percent: 32,
  is_reseller: false,
  target_margin_percent: 28,
  discount_percent: 0,
};

export const EXAMPLE_RESELLER_COMPANY: Company = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "Print Partners",
  margin_percent: 18,
  is_reseller: true,
  target_margin_percent: 22,
  discount_percent: 5,
};

export const EXAMPLE_COMPANIES: Company[] = [
  EXAMPLE_DTC_COMPANY,
  EXAMPLE_RESELLER_COMPANY,
];

const ALL_PRODUCTS = [
  "Roll Labels",
  "Custom Die-Cut Stickers",
  "Bumper Stickers",
  "Custom Magnets",
  "Printed Packaging Tape",
  "Foil Embossing & Specialty",
  "Variable Data / QR / Serialized",
  "Parking Decals & Permits",
];

const COMMON_MATERIALS = [
  "Matte BOPP",
  "Gloss BOPP",
  "UV Vinyl",
  "Gloss PET",
  "Foil Laminate",
];

export const EXAMPLE_EQUIPMENT: Equipment[] = [
  {
    id: "11111111-1111-4000-8000-000000000001",
    name: "EXAMPLE Digital Press",
    stage: "printer",
    cost_rate: 85,
    run_speed: 8000,
    waste_percent: 3,
    setup_time_minutes: 15,
    capabilities: {
      products: ALL_PRODUCTS,
      materials: COMMON_MATERIALS,
      max_width_in: 13,
      max_colors: 6,
    },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
  {
    id: "11111111-1111-4000-8000-000000000002",
    name: "EXAMPLE Flexo Press",
    stage: "printer",
    cost_rate: 140,
    run_speed: 25000,
    waste_percent: 5,
    setup_time_minutes: 45,
    capabilities: {
      products: ["Roll Labels", "Variable Data / QR / Serialized"],
      materials: ["Matte BOPP", "Gloss BOPP", "Gloss PET"],
      max_width_in: 16,
      max_colors: 10,
    },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
  {
    id: "11111111-1111-4000-8000-000000000003",
    name: "EXAMPLE Seamer / Rewind",
    stage: "seamer",
    cost_rate: 45,
    run_speed: 20000,
    waste_percent: 1,
    setup_time_minutes: 10,
    capabilities: {
      products: ALL_PRODUCTS,
      materials: COMMON_MATERIALS,
    },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
  {
    id: "11111111-1111-4000-8000-000000000004",
    name: "EXAMPLE Finishing Line",
    stage: "finisher",
    cost_rate: 55,
    run_speed: 15000,
    waste_percent: 2,
    setup_time_minutes: 20,
    capabilities: {
      products: ALL_PRODUCTS,
      materials: COMMON_MATERIALS,
    },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
  {
    id: "11111111-1111-4000-8000-000000000005",
    name: "EXAMPLE Shipping Dock",
    stage: "shipping",
    cost_rate: 35,
    run_speed: 40000,
    waste_percent: 0,
    setup_time_minutes: 15,
    capabilities: {
      products: ALL_PRODUCTS,
      materials: COMMON_MATERIALS,
    },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
];

export const EXAMPLE_MATERIALS: Material[] = [
  {
    id: "22222222-2222-4000-8000-000000000001",
    name: "Matte BOPP",
    kind: "substrate",
    cost_per_sqin: 0.00035,
    cost_per_unit: 0,
    attributes: { products: ALL_PRODUCTS },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
  {
    id: "22222222-2222-4000-8000-000000000002",
    name: "Gloss BOPP",
    kind: "substrate",
    cost_per_sqin: 0.00038,
    cost_per_unit: 0,
    attributes: { products: ALL_PRODUCTS },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
  {
    id: "22222222-2222-4000-8000-000000000003",
    name: "UV Vinyl",
    kind: "substrate",
    cost_per_sqin: 0.00045,
    cost_per_unit: 0,
    attributes: {
      products: ["Bumper Stickers", "Custom Die-Cut Stickers", "Parking Decals & Permits"],
    },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
  {
    id: "22222222-2222-4000-8000-000000000004",
    name: "Gloss PET",
    kind: "substrate",
    cost_per_sqin: 0.00048,
    cost_per_unit: 0,
    attributes: { products: ALL_PRODUCTS },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
  {
    id: "22222222-2222-4000-8000-000000000005",
    name: "Foil Laminate",
    kind: "substrate",
    cost_per_sqin: 0.00062,
    cost_per_unit: 0,
    attributes: { products: ["Foil Embossing & Specialty", "Roll Labels"] },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
  {
    id: "22222222-2222-4000-8000-000000000006",
    name: "EXAMPLE Process Dye",
    kind: "dye",
    cost_per_sqin: 0,
    cost_per_unit: 0.85,
    attributes: { unit: "per color per 1000 labels" },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  },
];

const ROUTE_DIGITAL_ID = "33333333-3333-4000-8000-000000000001";
const ROUTE_FLEXO_ID = "33333333-3333-4000-8000-000000000002";
const ROUTE_DEFAULT_ID = "33333333-3333-4000-8000-000000000003";

function steps(
  routeId: string,
  ids: [string, string, string, string]
): ProductionRoute["steps"] {
  return (
    [
      ["printer", 1],
      ["seamer", 2],
      ["finisher", 3],
      ["shipping", 4],
    ] as const
  ).map(([stage, step_order], i) => ({
    id: ids[i],
    route_id: routeId,
    stage,
    step_order,
  }));
}

export const EXAMPLE_ROUTES: ProductionRoute[] = [
  {
    id: ROUTE_DIGITAL_ID,
    name: "Digital short-run",
    match_attributes: { max_quantity: 15000 },
    is_default: false,
    steps: steps(ROUTE_DIGITAL_ID, [
      "44444444-4444-4000-8000-000000000011",
      "44444444-4444-4000-8000-000000000012",
      "44444444-4444-4000-8000-000000000013",
      "44444444-4444-4000-8000-000000000014",
    ]),
  },
  {
    id: ROUTE_FLEXO_ID,
    name: "Flexo production",
    match_attributes: {
      products: ["Roll Labels", "Variable Data / QR / Serialized"],
      min_quantity: 15001,
    },
    is_default: false,
    steps: steps(ROUTE_FLEXO_ID, [
      "44444444-4444-4000-8000-000000000021",
      "44444444-4444-4000-8000-000000000022",
      "44444444-4444-4000-8000-000000000023",
      "44444444-4444-4000-8000-000000000024",
    ]),
  },
  {
    id: ROUTE_DEFAULT_ID,
    name: "Standard plant route",
    match_attributes: {},
    is_default: true,
    steps: steps(ROUTE_DEFAULT_ID, [
      "44444444-4444-4000-8000-000000000031",
      "44444444-4444-4000-8000-000000000032",
      "44444444-4444-4000-8000-000000000033",
      "44444444-4444-4000-8000-000000000034",
    ]),
  },
];

export const EXAMPLE_CATALOG: PricingCatalog = {
  equipment: EXAMPLE_EQUIPMENT,
  materials: EXAMPLE_MATERIALS,
  routes: EXAMPLE_ROUTES,
  source: "example",
};

export const PRODUCT_OPTIONS = ALL_PRODUCTS;
export const TYPE_OPTIONS = [
  "Prime / pressure-sensitive",
  "Industrial",
  "Outdoor / durable",
  "Specialty finish",
];
