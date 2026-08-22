import {
  EXAMPLE_CATALOG,
  EXAMPLE_COMPANIES,
  EXAMPLE_DTC_COMPANY,
} from "@/lib/data/example-catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type {
  Company,
  Equipment,
  Material,
  PricingCatalog,
  ProductionRoute,
  RouteStep,
} from "@/types";

function asNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapEquipment(row: Record<string, unknown>): Equipment {
  const stage = row.stage as Equipment["stage"];
  const unit = row.run_speed_unit === "fpm" || stage === "printer"
    ? "fpm"
    : "labels_per_hour";
  return {
    id: String(row.id),
    name: String(row.name),
    stage,
    cost_rate: asNumber(row.cost_rate),
    run_speed: asNumber(row.run_speed),
    run_speed_unit: unit,
    run_speed_fpm:
      row.run_speed_fpm == null || row.run_speed_fpm === ""
        ? null
        : asNumber(row.run_speed_fpm),
    waste_percent: asNumber(row.waste_percent),
    capabilities: (row.capabilities ?? {}) as Equipment["capabilities"],
    setup_time_minutes: asNumber(row.setup_time_minutes),
    notes: row.notes ? String(row.notes) : undefined,
    active: row.active !== false,
  };
}

function mapMaterial(row: Record<string, unknown>): Material {
  return {
    id: String(row.id),
    name: String(row.name),
    kind: row.kind as Material["kind"],
    cost_per_sqin: asNumber(row.cost_per_sqin),
    cost_per_unit: asNumber(row.cost_per_unit),
    attributes: (row.attributes ?? {}) as Record<string, unknown>,
    notes: row.notes ? String(row.notes) : undefined,
    active: row.active !== false,
  };
}

async function supabaseReader() {
  const admin = createAdminClient();
  if (admin) return admin;
  if (!isSupabaseConfigured()) return null;
  try {
    return await createClient();
  } catch {
    return null;
  }
}

export async function loadCatalog(): Promise<PricingCatalog> {
  const client = await supabaseReader();
  if (!client) return EXAMPLE_CATALOG;

  const [equipmentRes, materialsRes, routesRes, stepsRes] = await Promise.all([
    client.from("equipment").select("*").eq("active", true),
    client.from("materials").select("*").eq("active", true),
    client.from("production_routes").select("*"),
    client.from("route_steps").select("*").order("step_order"),
  ]);

  if (
    equipmentRes.error ||
    materialsRes.error ||
    routesRes.error ||
    stepsRes.error ||
    !equipmentRes.data?.length
  ) {
    return EXAMPLE_CATALOG;
  }

  const steps = (stepsRes.data ?? []) as RouteStep[];
  const routes: ProductionRoute[] = (routesRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    match_attributes: row.match_attributes ?? {},
    is_default: Boolean(row.is_default),
    steps: steps.filter((s) => s.route_id === row.id),
  }));

  const materials = (materialsRes.data as Record<string, unknown>[]).map(
    mapMaterial
  );

  return {
    equipment: (equipmentRes.data as Record<string, unknown>[]).map(mapEquipment),
    materials: materials.length ? materials : EXAMPLE_CATALOG.materials,
    routes,
    source: "supabase",
  };
}

export function mapCompany(row: Record<string, unknown>): Company {
  return {
    id: String(row.id),
    name: String(row.name),
    margin_percent: asNumber(row.margin_percent, 32),
    is_reseller: Boolean(row.is_reseller),
    target_margin_percent: asNumber(row.target_margin_percent, 28),
    discount_percent: asNumber(row.discount_percent, 0),
  };
}

export async function loadCompanies(): Promise<Company[]> {
  const client = await supabaseReader();
  if (!client) return EXAMPLE_COMPANIES;

  const { data, error } = await client
    .from("companies")
    .select(
      "id, name, margin_percent, is_reseller, target_margin_percent, discount_percent"
    )
    .order("name");

  if (error || !data?.length) return EXAMPLE_COMPANIES;
  return data.map((row) => mapCompany(row as Record<string, unknown>));
}

export async function loadCompany(id: string): Promise<Company | null> {
  const companies = await loadCompanies();
  return companies.find((c) => c.id === id) ?? null;
}

export async function defaultDtcCompany(): Promise<Company> {
  const companies = await loadCompanies();
  return companies.find((c) => !c.is_reseller) ?? EXAMPLE_DTC_COMPANY;
}
