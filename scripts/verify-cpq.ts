import assert from "node:assert/strict";
import { parseRfpDocument, parseSpecText } from "../src/lib/documents/parse-rfp";
import {
  EXAMPLE_CATALOG,
  EXAMPLE_DTC_COMPANY,
} from "../src/lib/data/example-catalog";
import { fillExampleCatalogGaps } from "../src/lib/pricing/catalog";
import { clusterArtworkColors } from "../src/lib/pricing/artwork-colors";
import {
  materialsForProduct,
  publicMaterialsByProduct,
  publicPickerMaterials,
  publicPickerMaterialsByProduct,
  toPublicMaterials,
} from "../src/lib/pricing/materials";
import {
  calculateLayouts,
  calculateQuote,
  calculateQuoteBreaks,
  pricedQuantities,
  stationCount,
  validQtyBreaks,
  viableAcrossValues,
  withAutoAcross,
} from "../src/lib/pricing/engine";
import {
  toPublicCalculateResponse,
  toSellPriceBreakdown,
} from "../src/lib/pricing/sell-price";
import type { QuoteSpec } from "../src/types";

const base: QuoteSpec = {
  product: "Roll Labels",
  type: "Prime / pressure-sensitive",
  material: "Matte BOPP",
  widthIn: 2.25,
  heightIn: 3.5,
  quantity: 10000,
  colors: 4,
  repeatIn: 3.5,
  across: 2,
};

const ungrouped: QuoteSpec = {
  ...base,
  qtyBreaks: [10000, 25000],
  grouped: false,
};
const grouped: QuoteSpec = {
  ...base,
  qtyBreaks: [10000, 25000],
  grouped: true,
};

assert.deepEqual(validQtyBreaks(ungrouped), [10000, 25000]);
assert.deepEqual(pricedQuantities(ungrouped), [10000, 25000]);
assert.deepEqual(pricedQuantities(grouped), [35000]);

const separate = calculateQuoteBreaks(ungrouped, EXAMPLE_DTC_COMPANY, EXAMPLE_CATALOG);
const family = calculateQuoteBreaks(grouped, EXAMPLE_DTC_COMPANY, EXAMPLE_CATALOG);

assert.equal(separate.breaks.length, 2);
assert.equal(family.breaks.length, 1);
assert.equal(family.pricedQuantity, 35000);
assert.equal(separate.breaks[0].breakdown.routeName, "Digital short-run");
assert.equal(family.primary?.routeName, "Flexo production");
assert.notEqual(
  separate.breaks[0].breakdown.finalPrice,
  family.primary?.finalPrice,
  "grouped family run must reprice through the engine"
);

const extraFields: QuoteSpec = {
  ...base,
  shape: "oval",
  unwind: 2,
  cornerRadius: '1/8"',
  coreSize: '3"',
  rush: true,
  premiumFinishes: ["Matte lamination"],
  finishing: ["Die cut"],
  features: ["Barcode"],
};
const priced = calculateQuote(base, EXAMPLE_DTC_COMPANY, EXAMPLE_CATALOG);
const captured = calculateQuote(extraFields, EXAMPLE_DTC_COMPANY, EXAMPLE_CATALOG);
assert.equal(
  priced.finalPrice,
  captured.finalPrice,
  "unused captured specs must not invent rates"
);

const stations: QuoteSpec = {
  ...base,
  frontColors: 4,
  backColors: 1,
  whitePlate: true,
  varnish: true,
};
assert.equal(stationCount(stations), 7);
const withStations = calculateQuote(stations, EXAMPLE_DTC_COMPANY, EXAMPLE_CATALOG);
const fourColor = calculateQuote(base, EXAMPLE_DTC_COMPANY, EXAMPLE_CATALOG);
assert.ok(
  withStations.dyeCost > fourColor.dyeCost,
  "white plate + varnish + back colors must hit the existing dye path"
);

const tooWide = calculateQuote(
  { ...base, widthIn: 40 },
  EXAMPLE_DTC_COMPANY,
  EXAMPLE_CATALOG
);
assert.equal(tooWide.viable, false);

const rollMats = materialsForProduct("Roll Labels", EXAMPLE_CATALOG).map((m) => m.name);
assert.ok(rollMats.includes("Matte BOPP"));
assert.ok(!rollMats.includes("UV Vinyl"));
const bumperMats = materialsForProduct("Bumper Stickers", EXAMPLE_CATALOG).map(
  (m) => m.name
);
assert.ok(bumperMats.includes("UV Vinyl"));
const publicByProduct = publicMaterialsByProduct(EXAMPLE_CATALOG);
assert.ok(publicByProduct["Roll Labels"].includes("Matte BOPP"));
assert.ok(publicByProduct["Roll Labels"].length > 0);
const publicMats = toPublicMaterials(EXAMPLE_CATALOG.materials);
assert.ok(publicMats.every((m) => m.cost_per_sqin === 0 && m.cost_per_unit === 0));
assert.ok(
  materialsForProduct("Roll Labels", { materials: publicMats, equipment: [] })
    .length > 0
);
assert.ok(
  materialsForProduct("Roll Labels", { materials: publicMats, equipment: [] })
    .some((m) => m.name === "Matte BOPP")
);
assert.ok(
  materialsForProduct("Bumper Stickers", {
    materials: publicMats,
    equipment: [],
  }).some((m) => m.name === "UV Vinyl")
);

const liveShapeEmptyMaterials = {
  ...EXAMPLE_CATALOG,
  materials: [],
  source: "supabase" as const,
};
const liveShapeNames = publicMaterialsByProduct(liveShapeEmptyMaterials);
assert.deepEqual(publicPickerMaterialsByProduct()["Roll Labels"], [
  "Matte BOPP",
  "Gloss BOPP",
  "Gloss PET",
  "Foil Laminate",
]);
assert.ok(liveShapeNames["Roll Labels"].includes("Matte BOPP"));
assert.ok(liveShapeNames["Bumper Stickers"].includes("UV Vinyl"));
assert.ok(
  materialsForProduct("Roll Labels", liveShapeEmptyMaterials).some(
    (m) => m.name === "Matte BOPP"
  )
);
assert.ok(toPublicMaterials([]).some((m) => m.name === "Gloss PET"));
assert.ok(publicPickerMaterials().some((m) => m.name === "Foil Laminate"));
assert.ok(publicPickerMaterials().every((m) => m.cost_per_sqin === 0));

const seededGaps = fillExampleCatalogGaps({
  equipment: EXAMPLE_CATALOG.equipment,
  materials: [],
  routes: [],
});
assert.equal(seededGaps.materials, EXAMPLE_CATALOG.materials);
assert.equal(seededGaps.routes, EXAMPLE_CATALOG.routes);
assert.ok(seededGaps.materials.some((m) => m.name === "Matte BOPP"));
assert.ok(seededGaps.materials.some((m) => m.name === "Gloss BOPP"));
assert.ok(seededGaps.materials.some((m) => m.name === "UV Vinyl"));
assert.ok(seededGaps.materials.some((m) => m.name === "Gloss PET"));
assert.ok(seededGaps.materials.some((m) => m.name === "Foil Laminate"));
assert.notEqual(seededGaps.source, "example");

const redPixels = Array.from({ length: 80 }, () => ({
  r: 200,
  g: 20,
  b: 20,
  a: 255,
}));
const bluePixels = Array.from({ length: 20 }, () => ({
  r: 20,
  g: 20,
  b: 200,
  a: 255,
}));
const colors = clusterArtworkColors([...redPixels, ...bluePixels]);
assert.ok(colors.length >= 2);
assert.ok(colors[0].hex.startsWith("#"));
assert.ok(Number(colors[0].pct) > Number(colors[1].pct));

const parsed = parseSpecText(
  "18,000 matte BOPP roll labels 2.25 x 3.5, 4 color process"
);
assert.equal(parsed.product, "Roll Labels");
assert.equal(parsed.material, "Matte BOPP");
assert.equal(parsed.widthIn, 2.25);
assert.equal(parsed.quantity, 18000);
assert.ok(!parsed.missingFields.includes("quantity"));

const rfp = parseRfpDocument(`ITEM 1 — Bumper stickers
UV Vinyl 4 x 2, 5000 qty, 2 colors`);
assert.equal(rfp[0].parsed.product, "Bumper Stickers");
assert.equal(rfp[0].ready, true);

const incomplete = parseRfpDocument("Matte BOPP 2.25 x 3.5, 10000");
assert.equal(incomplete[0].ready, false);
assert.ok(incomplete[0].missing.includes("Product"));

const acrosses = viableAcrossValues(base, EXAMPLE_CATALOG);
assert.ok(acrosses.includes(1));
assert.ok(acrosses.includes(2));
const layouts = calculateLayouts(base, EXAMPLE_DTC_COMPANY, EXAMPLE_CATALOG);
assert.ok(layouts.length >= 2);
assert.ok(layouts[0].breakdown.finalPrice <= layouts[layouts.length - 1].breakdown.finalPrice);

const sell = toSellPriceBreakdown(priced);
assert.equal(sell.finalPrice, priced.finalPrice);
assert.equal(sell.totalCost, 0);
assert.equal(sell.marginPercent, 0);
assert.equal(sell.marginAmount, 0);
assert.equal(sell.routeName, "");
assert.equal(sell.lines.length, 0);
assert.equal(sell.productionFeet, 0);
assert.equal(sell.plannedPressHours, 0);
assert.equal(sell.needsApproval, false);

const publicCalc = toPublicCalculateResponse(separate);
assert.equal(publicCalc.finalPrice, separate.primary?.finalPrice);
assert.ok(publicCalc.breaks.every((b) => typeof b.finalPrice === "number"));
assert.equal(JSON.stringify(publicCalc).includes("margin"), false);
assert.equal(JSON.stringify(publicCalc).includes("routeName"), false);
assert.equal(JSON.stringify(publicCalc).includes("webIn"), false);
assert.equal(JSON.stringify(publicCalc).includes("hours"), false);

const autoAcross = calculateQuote(
  { ...base, across: 0 },
  EXAMPLE_DTC_COMPANY,
  EXAMPLE_CATALOG
);
assert.ok(autoAcross.finalPrice > 0);
assert.ok((autoAcross.productionFeet ?? 0) > 0);
const resolvedAcross = withAutoAcross(
  { ...base, across: 0 },
  EXAMPLE_DTC_COMPANY,
  EXAMPLE_CATALOG
);
assert.ok(resolvedAcross.across > 0);
assert.ok(resolvedAcross.repeatIn > 0);

assert.ok(!JSON.stringify(EXAMPLE_CATALOG).includes("Fortis"));
assert.ok(!JSON.stringify(EXAMPLE_CATALOG).includes("Novi"));

console.log("CPQ quantity-break and artwork checks passed.");
console.log(
  `ungrouped 10k ${separate.breaks[0].breakdown.routeName} vs grouped 35k ${family.primary?.routeName}`
);
