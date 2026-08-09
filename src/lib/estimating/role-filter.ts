import type { PricedEstimate, RoleFilteredEstimate, RoleView } from "./types";

export function filterEstimateForRole(
  priced: PricedEstimate,
  role: RoleView
): RoleFilteredEstimate {
  const base: RoleFilteredEstimate = {
    role,
    sellPrice: priced.sellPrice,
    sellPricePerM: priced.sellPricePerM,
    quantity: priced.input.quantity,
    routeSummary: {
      plantName: priced.route.plant.name,
      pressName: priced.route.press.name,
      finishingName: priced.route.finishing?.name,
      tier: priced.route.tier,
    },
  };

  if (role === "customer") {
    return base;
  }

  base.summary = {
    totalCost: priced.costs.totalCost,
    costPerM: priced.costs.costPerM,
    grossMargin: priced.grossMargin,
    grossMarginPct: priced.grossMarginPct,
    pricingMode: priced.pricingMode,
  };

  if (role === "ep") {
    base.costs = priced.costs;
    base.marginal = priced.marginal;
    base.rationale = priced.route.rationale;
  }

  return base;
}
