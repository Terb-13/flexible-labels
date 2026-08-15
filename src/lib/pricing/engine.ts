import { findMaterial } from "@/lib/data/material-master";
import { getDefaultRegistries } from "@/lib/pricing/registries";
import { recommendRoute } from "@/lib/pricing/select-asset";
import type {
  Company,
  CostBucket,
  Material,
  PricingRegistries,
  QuoteBreakdown,
  QuoteSpec,
} from "@/types";

export type CompanyMargin = Pick<
  Company,
  "margin_percent" | "target_margin_percent" | "is_reseller"
>;

export interface CalculateQuoteOptions {
  /** Extra sell-side discount after the customer margin is applied. */
  discountPercent?: number;
  registries?: PricingRegistries;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function requireMaterial(query: string, materials: Material[], label: string): Material {
  const found = findMaterial(query, materials);
  if (!found) {
    throw new Error(`${label} "${query}" is not in the Material Master.`);
  }
  return found;
}

function hoursCost(minutes: number, hourlyRate: number, electricityPerHour = 0): number {
  const hours = minutes / 60;
  return hours * (hourlyRate + electricityPerHour);
}

/**
 * Deterministic cost-plus engine.
 * All rates come from Material Master + Asset Registry + rate card.
 * Selling price uses customer.margin_percent as a sell-side margin:
 *   price = cost / (1 - margin/100)
 * needsApproval is true when actual margin < customer.target_margin_percent.
 */
export function calculateQuote(
  spec: QuoteSpec,
  company: CompanyMargin,
  options: CalculateQuoteOptions = {}
): QuoteBreakdown {
  const registries = options.registries ?? getDefaultRegistries();
  if (!registries.materials.length) {
    throw new Error("Material Master is empty — cannot price.");
  }
  if (!registries.assets.length) {
    throw new Error("Asset Registry is empty — cannot price.");
  }

  if (spec.quantity <= 0 || spec.widthIn <= 0 || spec.heightIn <= 0) {
    throw new Error("Quantity and dimensions must be greater than zero.");
  }

  const { materials, rateCard } = registries;
  const substrate = requireMaterial(spec.material, materials, "Material");
  if (substrate.category !== "substrate") {
    throw new Error(`"${substrate.name}" is not a substrate in the Material Master.`);
  }

  const adhesive = requireMaterial(
    spec.adhesive ?? rateCard.defaultAdhesiveId,
    materials,
    "Adhesive"
  );
  const ink = requireMaterial(rateCard.defaultInkId, materials, "Ink");
  const core = requireMaterial(rateCard.defaultCoreId, materials, "Core");
  const carton = requireMaterial(rateCard.defaultCartonId, materials, "Carton");
  const finishMaterial = spec.finish && spec.finish !== "None"
    ? findMaterial(spec.finish, materials)
    : undefined;

  const route = recommendRoute(spec, registries.assets);
  const { press } = route;

  const areaSqIn = spec.widthIn * spec.heightIn * spec.quantity;
  const msi = areaSqIn / 1000;
  const waste = 1 + substrate.wasteFactor + press.wastePercent;

  const materialCost = round2(
    msi * waste * (substrate.costPerMsi + adhesive.costPerMsi) +
      (finishMaterial ? msi * (1 + finishMaterial.wasteFactor) * finishMaterial.costPerMsi : 0)
  );

  const pressSetupMin = press.setupMinutes + spec.colors * press.setupMinutesPerColor;
  const pressRunMin = spec.quantity / Math.max(route.labelsPerMinute, 1);
  const pressCost = round2(
    hoursCost(pressRunMin, press.hourlyRate, press.electricityPerHour)
  );

  const inkCoverage = ink.coverageFactor ?? 0.35;
  const inkCost = round2(
    msi * ink.costPerMsi * Math.max(spec.colors, 1) * inkCoverage
  );

  const setupCost = round2(
    hoursCost(pressSetupMin, press.hourlyRate) +
      press.plateCostPerColor * Math.max(spec.colors, 0)
  );

  const finishingMinutes =
    (route.finishing?.setupMinutes ?? 0) +
    (route.rewind?.setupMinutes ?? 0) +
    (route.laminator?.setupMinutes ?? 0) +
    pressRunMin * 0.35;
  const finishingLabor = hoursCost(
    finishingMinutes,
    route.finishing?.hourlyRate ?? route.laminator?.hourlyRate ?? 0,
    route.finishing?.electricityPerHour ?? 0
  );
  const finishingCost = round2(finishingLabor);

  const labelsPerRoll = spec.labelsPerRoll ?? rateCard.defaultLabelsPerRoll;
  const rolls = Math.ceil(spec.quantity / Math.max(labelsPerRoll, 1));
  const cartons = Math.ceil(rolls / Math.max(rateCard.rollsPerCarton, 1));
  const packagingCost = round2(
    rolls * core.costPerUnit + cartons * carton.costPerUnit
  );

  let prepressCost = rateCard.prepressBase;
  if (spec.variableData) {
    prepressCost += rateCard.vdpSetup + (spec.quantity / 1000) * rateCard.vdpPerThousand;
  }
  prepressCost = round2(prepressCost);

  const buckets: CostBucket[] = [
    { key: "material", label: "Material", amount: materialCost },
    { key: "press", label: "Press Time", amount: pressCost },
    { key: "ink", label: "Ink", amount: inkCost },
    { key: "setup", label: "Setup", amount: setupCost },
    { key: "finishing", label: "Finishing", amount: finishingCost },
    { key: "packaging", label: "Packaging", amount: packagingCost },
    { key: "prepress", label: "Pre-press / Variable Data", amount: prepressCost },
  ];

  const totalCost = round2(buckets.reduce((sum, b) => sum + b.amount, 0));

  const appliedMarginPercent = company.margin_percent;
  if (appliedMarginPercent >= 100) {
    throw new Error("customer.margin_percent must be below 100.");
  }

  let finalPrice = round2(totalCost / (1 - appliedMarginPercent / 100));
  if (options.discountPercent && options.discountPercent > 0) {
    finalPrice = round2(finalPrice * (1 - options.discountPercent / 100));
  }

  const marginAmount = round2(finalPrice - totalCost);
  const actualMarginPercent =
    finalPrice > 0 ? round2((marginAmount / finalPrice) * 100) : 0;
  const needsApproval = actualMarginPercent < company.target_margin_percent;

  return {
    materialCost,
    pressCost,
    inkCost,
    setupCost,
    finishingCost,
    packagingCost,
    prepressCost,
    totalCost,
    marginPercent: actualMarginPercent,
    appliedMarginPercent,
    finalPrice,
    marginAmount,
    needsApproval,
    targetMarginPercent: company.target_margin_percent,
    recommendedAssetId: press.id,
    recommendedAssetName: press.name,
    recommendedResource: press.ganttResource,
    routeSteps: route.steps,
    materialSku: substrate.sku,
    materialName: substrate.name,
    across: route.across,
    runMinutes: round2(route.runMinutes),
    rationale: route.rationale,
    buckets,
  };
}

export function formatCurrency(amount: number, showCents = false): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0,
  }).format(amount);
}

export function formatQuantity(qty: number): string {
  return qty.toLocaleString("en-US");
}

/** Customer-safe quote: final price only. Never include cost or margin. */
export function toCustomerQuote(breakdown: QuoteBreakdown, quantity: number) {
  return {
    finalPrice: breakdown.finalPrice,
    unitPrice: quantity > 0 ? round2(breakdown.finalPrice / quantity) : 0,
    leadTime: "5–7 business days from approved proof",
  };
}
