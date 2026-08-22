/**
 * Seed EXAMPLE companies, equipment, materials, and production routes.
 * All rates are labeled EXAMPLE — they are not Flexible Label’s real plant costs.
 *
 *   npx tsx scripts/seed-demo.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";
import {
  EXAMPLE_COMPANIES,
  EXAMPLE_EQUIPMENT,
  EXAMPLE_MATERIALS,
  EXAMPLE_RATE_DISCLAIMER,
  EXAMPLE_ROUTES,
} from "../src/lib/data/example-catalog";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before seeding."
    );
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: companyError } = await supabase.from("companies").upsert(
    EXAMPLE_COMPANIES.map((c) => ({
      id: c.id,
      name: c.name,
      is_reseller: c.is_reseller,
      margin_percent: c.margin_percent,
      target_margin_percent: c.target_margin_percent,
      discount_percent: c.discount_percent,
    })),
    { onConflict: "id" }
  );
  if (companyError) throw companyError;

  const { error: equipmentError } = await supabase.from("equipment").upsert(
    EXAMPLE_EQUIPMENT.map((eq) => ({
      id: eq.id,
      name: eq.name,
      stage: eq.stage,
      cost_rate: eq.cost_rate,
      run_speed: eq.run_speed,
      waste_percent: eq.waste_percent,
      capabilities: eq.capabilities,
      setup_time_minutes: eq.setup_time_minutes,
      notes: eq.notes ?? EXAMPLE_RATE_DISCLAIMER,
      active: true,
    })),
    { onConflict: "id" }
  );
  if (equipmentError) throw equipmentError;

  const { error: materialError } = await supabase.from("materials").upsert(
    EXAMPLE_MATERIALS.map((m) => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      cost_per_sqin: m.cost_per_sqin,
      cost_per_unit: m.cost_per_unit,
      attributes: m.attributes,
      notes: m.notes ?? EXAMPLE_RATE_DISCLAIMER,
      active: true,
    })),
    { onConflict: "id" }
  );
  if (materialError) throw materialError;

  const { error: routeError } = await supabase.from("production_routes").upsert(
    EXAMPLE_ROUTES.map((r) => ({
      id: r.id,
      name: r.name,
      match_attributes: r.match_attributes,
      is_default: r.is_default,
    })),
    { onConflict: "id" }
  );
  if (routeError) throw routeError;

  const { error: stepError } = await supabase.from("route_steps").upsert(
    EXAMPLE_ROUTES.flatMap((r) =>
      r.steps.map((s) => ({
        id: s.id,
        route_id: s.route_id,
        stage: s.stage,
        step_order: s.step_order,
      }))
    ),
    { onConflict: "id" }
  );
  if (stepError) throw stepError;

  console.log("Seeded EXAMPLE companies, equipment, materials, and routes.");
  console.log("These rates are EXAMPLE only — replace them in Supabase before go-live.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
