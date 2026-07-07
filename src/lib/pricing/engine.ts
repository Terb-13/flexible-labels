import type { Company, QuoteBreakdown, QuoteSpec } from "@/types";

/** Cost-plus pricing engine with per-customer margin targets. */
export function calculateQuote(
  spec: QuoteSpec,
  company: Pick<Company, "margin_percent" | "target_margin_percent" | "is_reseller">
): QuoteBreakdown {
  const area = spec.widthIn * spec.heightIn;
  const sqInTotal = area * spec.quantity;

  // Base material cost per 1000 sq in varies by substrate
  const materialRate =
    spec.material.toLowerCase().includes("vinyl") ||
    spec.material.toLowerCase().includes("poly")
      ? 0.042
      : spec.material.toLowerCase().includes("foil")
        ? 0.058
        : 0.035;

  const materialCost = Math.round(sqInTotal * materialRate * 100) / 100;

  const colorFactor = 1 + Math.max(0, spec.colors - 1) * 0.08;
  const pressCost =
    Math.round((180 + sqInTotal * 0.012 * colorFactor) * 100) / 100;

  const finishingCost =
    Math.round((95 + sqInTotal * 0.006) * 100) / 100;

  const setupCost = spec.quantity < 5000 ? 275 : spec.quantity < 15000 ? 185 : 125;

  const variableDataCost = spec.variableData ? 145 + spec.quantity * 0.002 : 0;

  const totalCost =
    Math.round(
      (materialCost + pressCost + finishingCost + setupCost + variableDataCost) *
        100
    ) / 100;

  const marginPercent = company.margin_percent;
  const finalPrice =
    Math.round(totalCost * (1 + marginPercent / 100) * 100) / 100;
  const marginAmount = Math.round((finalPrice - totalCost) * 100) / 100;
  const actualMarginPercent =
    finalPrice > 0 ? Math.round((marginAmount / finalPrice) * 1000) / 10 : 0;

  const needsApproval = actualMarginPercent < company.target_margin_percent;

  return {
    materialCost,
    pressCost,
    finishingCost,
    setupCost: setupCost + variableDataCost,
    totalCost,
    marginPercent: actualMarginPercent,
    finalPrice,
    marginAmount,
    needsApproval,
    targetMarginPercent: company.target_margin_percent,
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
