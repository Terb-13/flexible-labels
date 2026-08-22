/**
 * Seeds EXAMPLE-only ERP loop rows via the Supabase service role.
 * Usage: npm run db:seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 * Rates in this file are invented placeholders — not Flexible Label production rates.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  SEED_COMPANIES,
  SEED_EQUIPMENT,
  SEED_MATERIALS,
  SEED_ROUTE,
  SEED_ROUTE_STEPS,
  allSeedBusinessLabels,
  assertExampleOnlyLabels,
} from "./seed-data";

function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const raw of readFileSync(path, "utf8").split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      const value = line.slice(eq + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}

type SeedClient = {
  from: (table: string) => {
    upsert: (
      rows: object[],
      options: { onConflict: string }
    ) => Promise<{ error: { message: string } | null }>;
  };
};

async function upsert(
  client: SeedClient,
  table: string,
  rows: readonly object[]
) {
  const { error } = await client.from(table).upsert([...rows], { onConflict: "id" });
  if (error) {
    throw new Error(`${table}: ${error.message}`);
  }
  console.log(`upserted ${rows.length} EXAMPLE row(s) into ${table}`);
}

async function main() {
  loadLocalEnv();
  assertExampleOnlyLabels(allSeedBusinessLabels());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.error(
      "db:seed needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Alternatively apply supabase/seed.sql in the Supabase SQL editor."
    );
    process.exit(1);
  }

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }) as unknown as SeedClient;

  await upsert(client, "companies", SEED_COMPANIES);
  await upsert(client, "equipment", SEED_EQUIPMENT);
  await upsert(client, "materials", SEED_MATERIALS);
  await upsert(client, "production_routes", [SEED_ROUTE]);
  await upsert(client, "route_steps", SEED_ROUTE_STEPS);

  console.log(
    "EXAMPLE seed complete. Placeholder rates are not Flexible Label production rates."
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
