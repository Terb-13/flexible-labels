import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  SEED_COMPANIES,
  SEED_EQUIPMENT,
  SEED_MATERIALS,
  SEED_ROUTE,
  SEED_ROUTE_STEPS,
  allSeedBusinessLabels,
  assertExampleOnlyLabels,
} from "./seed-data";

describe("EXAMPLE seed labels", () => {
  it("requires EXAMPLE in every seeded business name", () => {
    assert.doesNotThrow(() => assertExampleOnlyLabels(allSeedBusinessLabels()));
  });

  it("seeds one reseller and one DTC EXAMPLE company", () => {
    assert.equal(SEED_COMPANIES.filter((c) => c.is_reseller).length, 1);
    assert.equal(SEED_COMPANIES.filter((c) => !c.is_reseller).length, 1);
  });

  it("seeds EXAMPLE printer, seamer, finisher, and shipping", () => {
    const types = SEED_EQUIPMENT.map((row) => row.type).sort();
    assert.deepEqual(types, ["finisher", "printer", "seamer", "shipping"]);
  });

  it("seeds two EXAMPLE substrates and one EXAMPLE dye", () => {
    assert.equal(SEED_MATERIALS.filter((row) => row.kind === "substrate").length, 2);
    assert.equal(SEED_MATERIALS.filter((row) => row.kind === "dye").length, 1);
  });

  it("seeds one EXAMPLE route printer → seamer → finisher → shipping", () => {
    assert.equal(SEED_ROUTE.name.includes("EXAMPLE"), true);
    assert.deepEqual(
      SEED_ROUTE_STEPS.map((step) => step.equipment_type),
      ["printer", "seamer", "finisher", "shipping"]
    );
  });

  it("keeps supabase/seed.sql aligned with EXAMPLE-only labels", () => {
    const sql = readFileSync(resolve(process.cwd(), "supabase/seed.sql"), "utf8");
    for (const label of allSeedBusinessLabels()) {
      assert.equal(sql.includes(label), true, `seed.sql missing ${label}`);
    }
    assert.equal(sql.toLowerCase().includes("acme"), false);
  });
});
