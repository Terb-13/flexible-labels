import assert from "node:assert/strict";
import {
  EXAMPLE_CATALOG,
  EXAMPLE_DTC_COMPANY,
  EXAMPLE_RESELLER_COMPANY,
} from "../src/lib/data/example-catalog";
import { calculateQuote, matchRoute, qualifyEquipment } from "../src/lib/pricing/engine";

const rollSpec = {
  product: "Roll Labels",
  type: "Prime / pressure-sensitive",
  material: "Matte BOPP",
  widthIn: 2.25,
  heightIn: 3.5,
  quantity: 10000,
  colors: 4,
};

const longRun = { ...rollSpec, quantity: 40000 };

const digital = matchRoute(rollSpec, EXAMPLE_CATALOG.routes);
assert.equal(digital.name, "Digital short-run");

const flexo = matchRoute(longRun, EXAMPLE_CATALOG.routes);
assert.equal(flexo.name, "Flexo production");

const printer = qualifyEquipment("printer", rollSpec, EXAMPLE_CATALOG.equipment);
assert.equal(printer?.name, "EXAMPLE Digital Press");

const flexoPress = qualifyEquipment("printer", longRun, EXAMPLE_CATALOG.equipment);
assert.ok(flexoPress);

const dtc = calculateQuote(rollSpec, EXAMPLE_DTC_COMPANY, EXAMPLE_CATALOG);
assert.equal(dtc.lines.length, 4);
assert.deepEqual(
  dtc.lines.map((l) => l.stage),
  ["printer", "seamer", "finisher", "shipping"]
);
assert.ok(dtc.finalPrice > dtc.totalCost);
assert.equal(dtc.catalogSource, "example");
assert.ok(dtc.materialCost > 0);
assert.ok(dtc.pressCost > 0);

const reseller = calculateQuote(rollSpec, EXAMPLE_RESELLER_COMPANY, EXAMPLE_CATALOG);
assert.ok(reseller.finalPrice < dtc.finalPrice);
assert.equal(reseller.discountPercent, 5);

console.log("ERP pricing checks passed.");
console.log(
  `DTC ${dtc.finalPrice} vs reseller ${reseller.finalPrice} via ${dtc.routeName}`
);
