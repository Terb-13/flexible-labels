import assert from "node:assert/strict";
import {
  EXAMPLE_CATALOG,
  EXAMPLE_DTC_COMPANY,
  EXAMPLE_PRODUCT_EQUIPMENT_MAP,
  EXAMPLE_RESELLER_COMPANY,
} from "../src/lib/data/example-catalog";
import {
  DEMO_COMPANY,
  DEMO_HISTORY,
  DEMO_ORDERS,
} from "../src/lib/data/demo-data";
import { forCompany } from "../src/lib/data/tenant";
import { calculateQuote, matchRoute, qualifyEquipment } from "../src/lib/pricing/engine";
import "./verify-floor";

const labelSpec = {
  product: "Labels",
  type: "Industrial / facility",
  material: "EXAMPLE Label substrate",
  widthIn: 2.25,
  heightIn: 3.5,
  quantity: 10000,
  colors: 4,
  repeatIn: 3.5,
  across: 2,
};

const longRun = { ...labelSpec, quantity: 40000 };

const shortRoute = matchRoute(labelSpec, EXAMPLE_CATALOG.routes);
assert.equal(shortRoute.name, "EXAMPLE Labels short-run (process = route)");

const prodRoute = matchRoute(longRun, EXAMPLE_CATALOG.routes);
assert.equal(prodRoute.name, "EXAMPLE Labels production (process = route)");

const printer = qualifyEquipment("printer", labelSpec, EXAMPLE_CATALOG.equipment);
assert.equal(printer?.name, "EXAMPLE Label process press");
assert.deepEqual(EXAMPLE_PRODUCT_EQUIPMENT_MAP.Labels, [
  "EXAMPLE Label process press",
]);

const kitSpec = { ...labelSpec, product: "Packaging / Kits", material: "EXAMPLE Kit board / carton" };
const kitRoute = matchRoute(kitSpec, EXAMPLE_CATALOG.routes);
assert.equal(kitRoute.name, "EXAMPLE Packaging / kit route");

const dtc = calculateQuote(labelSpec, EXAMPLE_DTC_COMPANY, EXAMPLE_CATALOG);
assert.equal(dtc.lines.length, 4);
assert.deepEqual(
  dtc.lines.map((l) => l.stage),
  ["printer", "seamer", "finisher", "shipping"]
);
assert.ok(dtc.finalPrice > dtc.totalCost);
assert.equal(dtc.catalogSource, "example");
assert.ok(dtc.materialCost > 0);
assert.ok(dtc.pressCost > 0);

const reseller = calculateQuote(labelSpec, EXAMPLE_RESELLER_COMPANY, EXAMPLE_CATALOG);
assert.ok(reseller.finalPrice < dtc.finalPrice);
assert.equal(reseller.discountPercent, 10);

const buyerOrders = forCompany(DEMO_ORDERS, DEMO_COMPANY.id);
assert.ok(buyerOrders.length > 0);
assert.ok(buyerOrders.every((o) => o.company_id === DEMO_COMPANY.id));
assert.ok(
  buyerOrders.every((o) => /EXAMPLE Buyer/i.test(o.description)),
  "EXAMPLE Buyer portal must not list other companies' jobs"
);
assert.equal(forCompany(DEMO_ORDERS, null).length, 0);
assert.ok(
  forCompany(DEMO_HISTORY, DEMO_COMPANY.id).every((o) =>
    /EXAMPLE Buyer/i.test(o.description)
  )
);

assert.ok(!JSON.stringify(EXAMPLE_CATALOG).includes("Acme"));
assert.ok(!JSON.stringify(EXAMPLE_CATALOG).includes("Matte BOPP"));
assert.ok(!JSON.stringify(EXAMPLE_CATALOG).includes("Flexible Label"));
assert.ok(!JSON.stringify(DEMO_ORDERS).includes("FLG-"));
assert.ok(!JSON.stringify(DEMO_ORDERS).includes("Summit Pharma"));

console.log("ERP pricing and tenant-scope checks passed.");
console.log(
  `DTC ${dtc.finalPrice} vs reseller ${reseller.finalPrice} via ${dtc.routeName}`
);
