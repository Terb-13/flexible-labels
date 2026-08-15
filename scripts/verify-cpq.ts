/**
 * Quality-bar verification for the FLG Estimating / CPQ system.
 * Run: npx tsx scripts/verify-cpq.ts
 */
import { parseSpecFromText } from "../src/lib/documents/parse-spec";
import { DEMO_COMPANY, DEMO_RESELLER } from "../src/lib/data/demo-data";
import { MATERIAL_MASTER } from "../src/lib/data/material-master";
import { ASSET_REGISTRY, MEMPHIS_RATE_CARD } from "../src/lib/data/asset-registry";
import {
  createEstimate,
  createJobTicket,
  loadCpqSnapshot,
  recordApproval,
  saveCpqSnapshot,
} from "../src/lib/cpq/store";
import { ticketToScheduleJob } from "../src/lib/cpq/job-ticket";
import { calculateQuote, toCustomerQuote } from "../src/lib/pricing/engine";
import { getDefaultRegistries } from "../src/lib/pricing/registries";
import type { QuoteSpec } from "../src/types";

let failed = 0;

function assert(cond: unknown, msg: string) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
  } else {
    console.log(`PASS  ${msg}`);
  }
}

const SPEC: QuoteSpec = {
  productType: "Roll Labels",
  widthIn: 2.25,
  heightIn: 3.5,
  quantity: 10000,
  colors: 4,
  material: "Matte BOPP",
  finish: "None",
  variableData: false,
};

function resetStore() {
  saveCpqSnapshot({ estimates: [], approvals: [], tickets: [] });
}

// --- 1. Deterministic Pricing Engine ---
const registries = getDefaultRegistries();
assert(registries.materials.length > 0, "Material Master is populated");
assert(registries.assets.length > 0, "Asset Registry is populated");

const direct = calculateQuote(SPEC, DEMO_COMPANY);
const buckets = new Set(direct.buckets.map((b) => b.key));
for (const key of ["material", "press", "ink", "setup", "finishing", "packaging", "prepress"]) {
  assert(buckets.has(key as never), `cost bucket present: ${key}`);
}
assert(
  Math.abs(direct.buckets.reduce((s, b) => s + b.amount, 0) - direct.totalCost) < 0.02,
  "buckets sum to totalCost"
);

const bumped = {
  ...registries,
  materials: registries.materials.map((m) =>
    m.id === "matte-bopp" ? { ...m, costPerMsi: m.costPerMsi * 2 } : m
  ),
};
const bumpedQuote = calculateQuote(SPEC, DEMO_COMPANY, { registries: bumped });
assert(
  bumpedQuote.materialCost > direct.materialCost,
  "material cost follows live Material Master (no hard-coded rate)"
);

const fasterPress = {
  ...registries,
  assets: registries.assets.map((a) =>
    a.id === direct.recommendedAssetId ? { ...a, hourlyRate: a.hourlyRate * 2 } : a
  ),
};
const fasterQuote = calculateQuote(SPEC, DEMO_COMPANY, { registries: fasterPress });
assert(
  fasterQuote.pressCost > direct.pressCost,
  "press cost follows live Asset Registry hourly rate"
);

assert(
  Math.abs(direct.marginPercent - DEMO_COMPANY.margin_percent) < 0.15,
  `direct actual margin (${direct.marginPercent}) matches customer.margin_percent`
);
assert(
  direct.needsApproval === false,
  "direct quote at 32% is not below 28% target"
);

const reseller = calculateQuote(SPEC, DEMO_RESELLER);
assert(
  Math.abs(reseller.marginPercent - DEMO_RESELLER.margin_percent) < 0.15,
  `reseller actual margin (${reseller.marginPercent}) matches customer.margin_percent`
);
assert(
  reseller.needsApproval === true,
  "reseller 18% margin is below 22% target → needsApproval"
);
assert(reseller.finalPrice < direct.finalPrice, "reseller final price is lower than direct");

const discounted = calculateQuote(SPEC, DEMO_COMPANY, { discountPercent: 20 });
assert(
  discounted.needsApproval === true,
  "20% discount on a direct quote drops below target margin"
);

let threw = false;
try {
  calculateQuote({ ...SPEC, material: "Unobtanium Film" }, DEMO_COMPANY);
} catch {
  threw = true;
}
assert(threw, "unknown material is rejected (rate is never invented)");

const vdp = calculateQuote({ ...SPEC, variableData: true }, DEMO_COMPANY);
assert(vdp.prepressCost > direct.prepressCost, "VDP increases pre-press bucket");
assert(
  vdp.recommendedAssetId === "mem-d01" || vdp.rationale.some((r) => /digital|variable/i.test(r)),
  "variable data prefers a digital-capable asset"
);

// --- 2. Document Intelligence ---
const clean = parseSpecFromText(
  "Please quote 18,000 matte BOPP roll labels 2.25 x 3.5 for refrigerated beverage, 4 colors"
);
assert(clean.quantity === 18000, "clean input extracts quantity");
assert(clean.widthIn === 2.25 && clean.heightIn === 3.5, "clean input extracts dimensions");
assert(clean.material === "Matte BOPP", "clean input extracts material");
assert(clean.productType === "Roll Labels", "clean input extracts product type");
assert(clean.colors === 4, "clean input extracts color count");
assert(clean.missingFields.length === 0, "clean input has empty missingFields");

const incomplete = parseSpecFromText("Need labels for a new beverage launch, please call me");
assert(incomplete.quantity === undefined, "incomplete input does not invent quantity");
assert(incomplete.widthIn === undefined, "incomplete input does not invent width");
assert(incomplete.heightIn === undefined, "incomplete input does not invent height");
assert(incomplete.material === undefined, "incomplete input does not invent material");
assert(incomplete.missingFields.includes("quantity"), "missingFields includes quantity");
assert(incomplete.missingFields.includes("dimensions"), "missingFields includes dimensions");
assert(incomplete.missingFields.includes("material"), "missingFields includes material");

const excelish = parseSpecFromText(
  "Product Type Quantity Width Height Material Colors\nBumper Stickers 2500 3 x 11.5 UV Vinyl 4"
);
assert(excelish.quantity === 2500, "tabular/excel-like text extracts quantity");
assert(excelish.material === "UV Vinyl", "tabular/excel-like text extracts material");

// --- 3. Dual surfaces ---
const customerView = toCustomerQuote(direct, SPEC.quantity);
const customerKeys = Object.keys(customerView);
assert(
  !customerKeys.some((k) => /cost|margin|approval|bucket/i.test(k)),
  "customer view exposes no cost or margin keys"
);
assert(customerView.finalPrice === direct.finalPrice, "customer view still has the final price");

// --- 4. Margin protection + 5. Closed loop ---
resetStore();
const pending = createEstimate({
  companyId: DEMO_RESELLER.id,
  companyName: DEMO_RESELLER.name,
  createdBy: "Jenna Torres",
  spec: SPEC,
  breakdown: reseller,
});
assert(pending.status === "pending_approval", "below-target estimate is pending approval");

let ticketBlocked = false;
try {
  createJobTicket({ estimateId: pending.id, actor: "Morgan Lee" });
} catch {
  ticketBlocked = true;
}
assert(ticketBlocked, "Job Ticket cannot be created before approval");

let reasonRequired = false;
try {
  recordApproval({
    estimateId: pending.id,
    decidedBy: "Morgan Lee",
    decision: "approved",
    reason: "   ",
  });
} catch {
  reasonRequired = true;
}
assert(reasonRequired, "approval reason is required");

const decision = recordApproval({
  estimateId: pending.id,
  decidedBy: "Morgan Lee",
  decision: "approved",
  reason: "Strategic reseller program — match last year's bid.",
});
assert(decision.decidedBy === "Morgan Lee", "approval logs who");
assert(Boolean(decision.decidedAt), "approval logs when");
assert(decision.reason.includes("Strategic"), "approval logs reason");

const ticket = createJobTicket({ estimateId: pending.id, actor: "Morgan Lee" });
assert(ticket.materialName === "Matte BOPP", "ticket carries material");
assert(ticket.recommendedAssetName.length > 0, "ticket carries recommended asset");
assert(ticket.quantity === 10000, "ticket carries quantity");
assert(ticket.internalRefs.estimateId === pending.id, "ticket carries estimate ref");
assert(ticket.internalRefs.approvalId === decision.id, "ticket carries approval ref");
assert(ticket.routeSteps.length > 0, "ticket carries route steps");

const job = ticketToScheduleJob(ticket, []);
assert(job.resource === ticket.recommendedResource, "ticket maps onto a Gantt resource");
assert(job.job_number === ticket.ticketNumber, "scheduler job uses ticket number");

resetStore();
const ok = createEstimate({
  companyId: DEMO_COMPANY.id,
  companyName: DEMO_COMPANY.name,
  createdBy: "Morgan Lee",
  spec: SPEC,
  breakdown: direct,
});
assert(ok.status === "approved", "at-target estimate is auto-approved");
const okTicket = createJobTicket({ estimateId: ok.id, actor: "Morgan Lee" });
assert(okTicket.ticketNumber.startsWith("JT-"), "approved estimate generates a job ticket");

const snap = loadCpqSnapshot();
assert(snap.tickets.length === 1, "runtime store retained the ticket");

assert(MATERIAL_MASTER.every((m) => m.sku && m.name), "every material has sku + name");
assert(
  ASSET_REGISTRY.every((a) => a.hourlyRate > 0 && a.avgSpeedFpm > 0),
  "every press/finisher has live rates"
);
assert(MEMPHIS_RATE_CARD.prepressBase > 0, "rate card supplies prepress / VDP rates");

if (failed) {
  console.error(`\n${failed} quality-bar check(s) failed.`);
  process.exit(1);
}

console.log("\nAll Estimating / CPQ quality bars passed.");
