import { EstimatingEngine } from "./EstimatingEngine";
import { getRegisterSnapshotSync } from "./register-store";
import { MEMPHIS_PLANT_CODE } from "./register-types";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

const register = getRegisterSnapshotSync();
assert(register.plants.length === 1, "expected single Memphis plant");
assert(register.plants[0].code === MEMPHIS_PLANT_CODE, "plant code MEM-TN");

const engine = new EstimatingEngine({ register });
const priced = engine.estimate({
  family: "pressure_sensitive",
  productType: "ps_label",
  plantId: MEMPHIS_PLANT_CODE,
  quantity: 10000,
  dimensions: { widthIn: 2.25, lengthIn: 3.5 },
  material: {
    id: "matte-bopp",
    name: "Matte BOPP",
    family: "pressure_sensitive",
    costPerMsi: 0.42,
  },
  ink: { colors: 4 },
  finishing: { dieCut: true, rewind: true },
  marginMultiplier: 1.35,
});

assert(priced.sellPrice > 0, "sell price > 0");
assert(priced.route.plant.code === MEMPHIS_PLANT_CODE, "routed to Memphis");
assert(priced.costs.lines.length >= 5, "cost breakdown present");

const tiers = engine.estimateTiers({
  family: "pressure_sensitive",
  productType: "ps_label",
  quantity: 2500,
  dimensions: { widthIn: 2, lengthIn: 2 },
  material: {
    id: "matte-bopp",
    name: "Matte BOPP",
    family: "pressure_sensitive",
    costPerMsi: 0.42,
  },
  ink: { colors: 4 },
});
assert(tiers.length >= 1, "at least one tier");

console.log("EstimatingEngine OK", {
  plant: priced.route.plant.name,
  press: priced.route.press.name,
  sellPrice: priced.sellPrice,
  tiers: tiers.map((t) => t.route.tier),
});
