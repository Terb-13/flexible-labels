import type {
  QuoteBreakdown,
  QuoteBreakResult,
  QuoteLayoutOption,
} from "@/types";

/** Price-only breakdown for customer-facing UI. Zeros internals. */
export function toSellPriceBreakdown(breakdown: QuoteBreakdown): QuoteBreakdown {
  return {
    materialCost: 0,
    substrateCost: 0,
    dyeCost: 0,
    pressCost: 0,
    seamerCost: 0,
    finishingCost: 0,
    shippingCost: 0,
    setupCost: 0,
    totalCost: 0,
    marginPercent: 0,
    finalPrice: breakdown.finalPrice,
    marginAmount: 0,
    needsApproval: false,
    targetMarginPercent: 0,
    discountPercent: 0,
    companyMarginPercent: 0,
    routeName: "",
    routeId: "",
    lines: [],
    catalogSource: "example",
    productionFeet: 0,
    plannedPressHours: 0,
    viable: breakdown.viable,
  };
}

export function toSellPriceBreaks(breaks: QuoteBreakResult[]): QuoteBreakResult[] {
  return breaks.map((item) => ({
    quantity: item.quantity,
    viable: item.viable,
    breakdown: toSellPriceBreakdown(item.breakdown),
  }));
}

export function toSellPriceLayouts(layouts: QuoteLayoutOption[]): QuoteLayoutOption[] {
  return layouts.map((layout) => ({
    across: layout.across,
    webIn: layout.webIn,
    viable: layout.viable,
    finalPrice: layout.finalPrice,
    perUnit: layout.perUnit,
    routeName: "",
  }));
}
