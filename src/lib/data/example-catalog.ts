import type {
  Company,
  Equipment,
  Material,
  PricingCatalog,
  ProductionRoute,
} from "@/types";

/**
 * EXAMPLE stubs for local preview and first seed.
 * These are not Summit Graphics plant rates. Do not treat them as production
 * numbers. Engine-exercise values only — replace in Supabase before go-live.
 */
export const EXAMPLE_RATE_DISCLAIMER =
  "EXAMPLE stub — not a Summit Graphics plant rate. Replace before production quotes.";

export const EXAMPLE_FPM_DISCLAIMER =
  "EXAMPLE fpm stub — not a published Summit press speed.";

/** Engine-exercise unit only. Intentionally not a copied Flexible Label figure. */
export const EXAMPLE_ENGINE_STUB_RATE = 1;
export const EXAMPLE_ENGINE_STUB_SQIN = 0.001;
export const EXAMPLE_ENGINE_STUB_FPM = 100;
export const EXAMPLE_ENGINE_STUB_UNITS_PER_HOUR = 1000;

export const EXAMPLE_DTC_COMPANY: Company = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "EXAMPLE Buyer (DTC)",
  margin_percent: 25,
  is_reseller: false,
  target_margin_percent: 20,
  discount_percent: 0,
};

export const EXAMPLE_RESELLER_COMPANY: Company = {
  id: "00000000-0000-4000-8000-000000000002",
  name: "EXAMPLE Buyer (Reseller)",
  margin_percent: 20,
  is_reseller: true,
  target_margin_percent: 15,
  discount_percent: 10,
};

export const EXAMPLE_COMPANIES: Company[] = [
  EXAMPLE_DTC_COMPANY,
  EXAMPLE_RESELLER_COMPANY,
];

/** UAT product types from summitgraphics.org / buyer UAT. */
const ALL_PRODUCTS = [
  "Packaging / Kits",
  "Labels",
  "Signs",
  "Decals",
  "Electronic / Serialized",
];

export const PRODUCT_OPTIONS = ALL_PRODUCTS;

export const TYPE_OPTIONS = [
  "Telecom / electronics kit",
  "Industrial / facility",
  "Outdoor / durable",
  "Serialized / compliance",
];

const PACKAGING = "Packaging / Kits";
const LABELS = "Labels";
const SIGNS = "Signs";
const DECALS = "Decals";
const SERIALIZED = "Electronic / Serialized";

const MAT_KIT = "EXAMPLE Kit board / carton";
const MAT_LABEL = "EXAMPLE Label substrate";
const MAT_SIGN = "EXAMPLE Sign board";
const MAT_DECAL = "EXAMPLE Decal vinyl";
const MAT_SERIAL = "EXAMPLE Serialized media";

function stubEquipment(
  id: string,
  name: string,
  stage: Equipment["stage"],
  products: string[],
  materials: string[],
  extra: Partial<Equipment> = {}
): Equipment {
  const isPress = stage === "printer";
  return {
    id,
    name,
    stage,
    cost_rate: EXAMPLE_ENGINE_STUB_RATE,
    run_speed: EXAMPLE_ENGINE_STUB_UNITS_PER_HOUR,
    run_speed_unit: isPress ? "fpm" : "labels_per_hour",
    run_speed_fpm: isPress ? EXAMPLE_ENGINE_STUB_FPM : null,
    waste_percent: 1,
    setup_time_minutes: 10,
    capabilities: {
      products,
      materials,
    },
    notes: isPress
      ? `${EXAMPLE_RATE_DISCLAIMER} ${EXAMPLE_FPM_DISCLAIMER}`
      : EXAMPLE_RATE_DISCLAIMER,
    active: true,
    ...extra,
  };
}

export const EXAMPLE_EQUIPMENT: Equipment[] = [
  stubEquipment(
    "11111111-1111-4000-8000-000000000001",
    "EXAMPLE Label process press",
    "printer",
    [LABELS],
    [MAT_LABEL],
    {
      capabilities: {
        products: [LABELS],
        materials: [MAT_LABEL],
        max_width_in: 12,
      },
    }
  ),
  stubEquipment(
    "11111111-1111-4000-8000-000000000002",
    "EXAMPLE Wide-format printer",
    "printer",
    [SIGNS],
    [MAT_SIGN],
    {
      capabilities: {
        products: [SIGNS],
        materials: [MAT_SIGN],
        max_width_in: 48,
      },
    }
  ),
  stubEquipment(
    "11111111-1111-4000-8000-000000000003",
    "EXAMPLE Carton / kit printer",
    "printer",
    [PACKAGING],
    [MAT_KIT],
    {
      capabilities: {
        products: [PACKAGING],
        materials: [MAT_KIT],
        max_width_in: 12,
      },
    }
  ),
  stubEquipment(
    "11111111-1111-4000-8000-000000000004",
    "EXAMPLE Decal printer",
    "printer",
    [DECALS],
    [MAT_DECAL],
    {
      capabilities: {
        products: [DECALS],
        materials: [MAT_DECAL],
        max_width_in: 12,
      },
    }
  ),
  stubEquipment(
    "11111111-1111-4000-8000-000000000005",
    "EXAMPLE Serialized print station",
    "printer",
    [SERIALIZED],
    [MAT_SERIAL],
    {
      capabilities: {
        products: [SERIALIZED],
        materials: [MAT_SERIAL],
        max_width_in: 12,
      },
    }
  ),
  stubEquipment(
    "11111111-1111-4000-8000-000000000006",
    "EXAMPLE Kit / assembly station",
    "seamer",
    [PACKAGING, SERIALIZED],
    [MAT_KIT, MAT_SERIAL]
  ),
  stubEquipment(
    "11111111-1111-4000-8000-000000000007",
    "EXAMPLE Die / tool station",
    "finisher",
    ALL_PRODUCTS,
    [MAT_KIT, MAT_LABEL, MAT_SIGN, MAT_DECAL, MAT_SERIAL]
  ),
  stubEquipment(
    "11111111-1111-4000-8000-000000000008",
    "EXAMPLE Shipping dock",
    "shipping",
    ALL_PRODUCTS,
    [MAT_KIT, MAT_LABEL, MAT_SIGN, MAT_DECAL, MAT_SERIAL]
  ),
];

function stubMaterial(
  id: string,
  name: string,
  kind: Material["kind"],
  products: string[],
  costs: { sqin?: number; unit?: number } = {}
): Material {
  return {
    id,
    name,
    kind,
    cost_per_sqin: costs.sqin ?? 0,
    cost_per_unit: costs.unit ?? 0,
    attributes: { products },
    notes: EXAMPLE_RATE_DISCLAIMER,
    active: true,
  };
}

export const EXAMPLE_MATERIALS: Material[] = [
  stubMaterial(
    "22222222-2222-4000-8000-000000000001",
    MAT_KIT,
    "substrate",
    [PACKAGING],
    { sqin: EXAMPLE_ENGINE_STUB_SQIN }
  ),
  stubMaterial(
    "22222222-2222-4000-8000-000000000002",
    MAT_LABEL,
    "substrate",
    [LABELS],
    { sqin: EXAMPLE_ENGINE_STUB_SQIN }
  ),
  stubMaterial(
    "22222222-2222-4000-8000-000000000003",
    MAT_SIGN,
    "substrate",
    [SIGNS],
    { sqin: EXAMPLE_ENGINE_STUB_SQIN }
  ),
  stubMaterial(
    "22222222-2222-4000-8000-000000000004",
    MAT_DECAL,
    "substrate",
    [DECALS],
    { sqin: EXAMPLE_ENGINE_STUB_SQIN }
  ),
  stubMaterial(
    "22222222-2222-4000-8000-000000000005",
    MAT_SERIAL,
    "substrate",
    [SERIALIZED],
    { sqin: EXAMPLE_ENGINE_STUB_SQIN }
  ),
  stubMaterial(
    "22222222-2222-4000-8000-000000000006",
    "EXAMPLE Process ink",
    "dye",
    ALL_PRODUCTS,
    { unit: EXAMPLE_ENGINE_STUB_RATE }
  ),
  stubMaterial("22222222-2222-4000-8000-000000000007", "EXAMPLE Die template", "die", ALL_PRODUCTS),
  stubMaterial("22222222-2222-4000-8000-000000000008", "EXAMPLE Tool template", "tool", ALL_PRODUCTS),
  stubMaterial("22222222-2222-4000-8000-000000000009", "EXAMPLE Other template", "other", ALL_PRODUCTS),
];

const ROUTE_LABELS_SHORT = "33333333-3333-4000-8000-000000000001";
const ROUTE_LABELS_PROD = "33333333-3333-4000-8000-000000000002";
const ROUTE_PACKAGING = "33333333-3333-4000-8000-000000000003";
const ROUTE_SIGNS = "33333333-3333-4000-8000-000000000004";
const ROUTE_DECALS = "33333333-3333-4000-8000-000000000005";
const ROUTE_SERIAL = "33333333-3333-4000-8000-000000000006";
const ROUTE_DEFAULT = "33333333-3333-4000-8000-000000000007";

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
    id: ROUTE_LABELS_SHORT,
    name: "EXAMPLE Labels short-run (process = route)",
    match_attributes: { products: [LABELS], max_quantity: 15000 },
    is_default: false,
    steps: steps(ROUTE_LABELS_SHORT, [
      "44444444-4444-4000-8000-000000000011",
      "44444444-4444-4000-8000-000000000012",
      "44444444-4444-4000-8000-000000000013",
      "44444444-4444-4000-8000-000000000014",
    ]),
  },
  {
    id: ROUTE_LABELS_PROD,
    name: "EXAMPLE Labels production (process = route)",
    match_attributes: { products: [LABELS], min_quantity: 15001 },
    is_default: false,
    steps: steps(ROUTE_LABELS_PROD, [
      "44444444-4444-4000-8000-000000000021",
      "44444444-4444-4000-8000-000000000022",
      "44444444-4444-4000-8000-000000000023",
      "44444444-4444-4000-8000-000000000024",
    ]),
  },
  {
    id: ROUTE_PACKAGING,
    name: "EXAMPLE Packaging / kit route",
    match_attributes: { products: [PACKAGING] },
    is_default: false,
    steps: steps(ROUTE_PACKAGING, [
      "44444444-4444-4000-8000-000000000031",
      "44444444-4444-4000-8000-000000000032",
      "44444444-4444-4000-8000-000000000033",
      "44444444-4444-4000-8000-000000000034",
    ]),
  },
  {
    id: ROUTE_SIGNS,
    name: "EXAMPLE Signs / wide-format route",
    match_attributes: { products: [SIGNS] },
    is_default: false,
    steps: steps(ROUTE_SIGNS, [
      "44444444-4444-4000-8000-000000000041",
      "44444444-4444-4000-8000-000000000042",
      "44444444-4444-4000-8000-000000000043",
      "44444444-4444-4000-8000-000000000044",
    ]),
  },
  {
    id: ROUTE_DECALS,
    name: "EXAMPLE Decals route",
    match_attributes: { products: [DECALS] },
    is_default: false,
    steps: steps(ROUTE_DECALS, [
      "44444444-4444-4000-8000-000000000051",
      "44444444-4444-4000-8000-000000000052",
      "44444444-4444-4000-8000-000000000053",
      "44444444-4444-4000-8000-000000000054",
    ]),
  },
  {
    id: ROUTE_SERIAL,
    name: "EXAMPLE Electronic / serialized route",
    match_attributes: { products: [SERIALIZED] },
    is_default: false,
    steps: steps(ROUTE_SERIAL, [
      "44444444-4444-4000-8000-000000000061",
      "44444444-4444-4000-8000-000000000062",
      "44444444-4444-4000-8000-000000000063",
      "44444444-4444-4000-8000-000000000064",
    ]),
  },
  {
    id: ROUTE_DEFAULT,
    name: "EXAMPLE Default plant route",
    match_attributes: {},
    is_default: true,
    steps: steps(ROUTE_DEFAULT, [
      "44444444-4444-4000-8000-000000000071",
      "44444444-4444-4000-8000-000000000072",
      "44444444-4444-4000-8000-000000000073",
      "44444444-4444-4000-8000-000000000074",
    ]),
  },
];

export const EXAMPLE_CATALOG: PricingCatalog = {
  equipment: EXAMPLE_EQUIPMENT,
  materials: EXAMPLE_MATERIALS,
  routes: EXAMPLE_ROUTES,
  source: "example",
};

/** Product → equipment attribute map (EXAMPLE stubs). */
export const EXAMPLE_PRODUCT_EQUIPMENT_MAP: Record<string, string[]> = {
  [PACKAGING]: ["EXAMPLE Carton / kit printer", "EXAMPLE Kit / assembly station"],
  [LABELS]: ["EXAMPLE Label process press"],
  [SIGNS]: ["EXAMPLE Wide-format printer"],
  [DECALS]: ["EXAMPLE Decal printer"],
  [SERIALIZED]: [
    "EXAMPLE Serialized print station",
    "EXAMPLE Kit / assembly station",
  ],
};
