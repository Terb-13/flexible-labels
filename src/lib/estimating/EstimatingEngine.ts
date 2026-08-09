import type { RegisterSnapshot } from "./register-types";
import { getRegisterSnapshotSync } from "./register-store";
import { RouteResolver } from "./RouteResolver";
import { filterEstimateForRole } from "./role-filter";
import type {
  CostBreakdown,
  CostLine,
  EstimateInput,
  MarginalLens,
  PricedEstimate,
  PricingMode,
  ResolvedRoute,
  RoleFilteredEstimate,
  RoleView,
} from "./types";

const DEFAULT_MARGIN = 1.35;
const DEFAULT_INK_COST_PER_MSI = 0.85;
const IDL_RATE_VS_DL = 0.35;
const MARGINAL_IDL_PORTION = 0.2;
const TOOLING_BASE = 175;
const FREIGHT_PER_M = 4.5;
const PREPRESS = 100;

export interface EstimatingEngineOptions {
  register?: RegisterSnapshot;
  defaultMarginMultiplier?: number;
}

/**
 * Deterministic pricing engine.
 * Pure computation given a register snapshot — no I/O inside estimate().
 */
export class EstimatingEngine {
  private readonly resolver: RouteResolver;
  private readonly defaultMargin: number;

  constructor(options: EstimatingEngineOptions = {}) {
    const register = options.register ?? getRegisterSnapshotSync();
    this.resolver = new RouteResolver(register);
    this.defaultMargin = options.defaultMarginMultiplier ?? DEFAULT_MARGIN;
  }

  estimate(input: EstimateInput): PricedEstimate {
    const route = this.resolver.resolveBest(input);
    return this.priceWithRoute(input, route);
  }

  estimateTiers(input: EstimateInput): PricedEstimate[] {
    const routes = this.resolver.resolve(input, { limit: 3 });
    return routes.map((route) => this.priceWithRoute(input, route));
  }

  estimateLayouts(input: EstimateInput): PricedEstimate[] {
    return this.resolver
      .resolveLayouts(input)
      .map((route) => this.priceWithRoute(input, route));
  }

  estimateQuantityBreaks(
    input: EstimateInput,
    breaks: number[],
    grouped: boolean
  ): PricedEstimate[] {
    const cleaned = breaks.filter((q) => q > 0);
    if (!cleaned.length) return [this.estimate(input)];

    if (grouped) {
      const sum = cleaned.reduce((a, b) => a + b, 0);
      return [this.estimate({ ...input, quantity: sum })];
    }

    return cleaned.map((qty) => this.estimate({ ...input, quantity: qty }));
  }

  forRole(priced: PricedEstimate, role: RoleView): RoleFilteredEstimate {
    return filterEstimateForRole(priced, role);
  }

  resolveRoutes(input: EstimateInput) {
    return this.resolver.resolve(input);
  }

  private priceWithRoute(
    input: EstimateInput,
    route: ResolvedRoute
  ): PricedEstimate {
    const totalSquareInches = this.totalSquareInches(input);
    const costs = this.buildCosts(input, route, totalSquareInches);
    const pricingMode: PricingMode = input.pricingMode ?? "cost_plus";
    const marginMultiplier = input.marginMultiplier ?? this.defaultMargin;

    const { sellPrice, sellPricePerM } = this.applyPricing(
      input,
      costs,
      pricingMode,
      marginMultiplier
    );

    const grossMargin = sellPrice - costs.totalCost;
    const grossMarginPct = sellPrice > 0 ? (grossMargin / sellPrice) * 100 : 0;
    const marginal = this.buildMarginalLens(costs, input.quantity);

    return {
      input,
      route,
      costs,
      pricingMode,
      sellPrice: round2(sellPrice),
      sellPricePerM: round2(sellPricePerM),
      marginMultiplier,
      grossMargin: round2(grossMargin),
      grossMarginPct: round2(grossMarginPct),
      marginal,
      totalSquareInches: round2(totalSquareInches),
      computedAt: new Date().toISOString(),
    };
  }

  private totalSquareInches(input: EstimateInput): number {
    return (
      input.dimensions.widthIn *
      input.dimensions.lengthIn *
      input.quantity
    );
  }

  private buildCosts(
    input: EstimateInput,
    route: ResolvedRoute,
    totalSquareInches: number
  ): CostBreakdown {
    const msi = totalSquareInches / 1000;
    const colors = input.ink?.colors ?? 4;
    const inkRate = input.ink?.costPerMsi ?? DEFAULT_INK_COST_PER_MSI;

    const material = msi * input.material.costPerMsi;
    const ink = msi * inkRate * Math.max(colors, 1) * 0.35;

    const hours = route.runMinutes / 60;
    const directLabor = hours * route.press.hourlyRate;
    const indirectLabor = directLabor * IDL_RATE_VS_DL;
    const electricity = hours * route.press.electricityPerHour;

    const finishingHours =
      (route.finishing?.setupMinutes ?? 0) / 60 +
      hours * (1 - (route.finishing?.speedFactor ?? 1));
    const finishing =
      finishingHours * (route.finishing?.hourlyRate ?? 95) +
      (input.finishing?.laminate ? msi * 0.45 : 0) +
      (input.finishing?.varnish ? msi * 0.2 : 0);

    const tooling = TOOLING_BASE + (input.finishing?.dieCut === false ? 0 : 85);
    const setup = PREPRESS;
    const freight = (input.quantity / 1000) * FREIGHT_PER_M;

    const lines: CostLine[] = [
      { bucket: "material", label: "Substrate", amount: round2(material) },
      { bucket: "ink", label: "Ink / toner", amount: round2(ink) },
      {
        bucket: "directLabor",
        label: `Press DL (${route.press.name})`,
        amount: round2(directLabor),
      },
      {
        bucket: "indirectLabor",
        label: "Indirect labor",
        amount: round2(indirectLabor),
      },
      {
        bucket: "electricity",
        label: "Electricity",
        amount: round2(electricity),
      },
      { bucket: "finishing", label: "Finishing", amount: round2(finishing) },
      { bucket: "tooling", label: "Tooling / die", amount: round2(tooling) },
      { bucket: "setup", label: "Prepress / setup", amount: round2(setup) },
      { bucket: "freight", label: "Freight allowance", amount: round2(freight) },
    ];

    const totalCost = round2(lines.reduce((s, l) => s + l.amount, 0));
    const costPerM = round2((totalCost / Math.max(input.quantity, 1)) * 1000);

    return { lines, totalCost, costPerM };
  }

  private applyPricing(
    input: EstimateInput,
    costs: CostBreakdown,
    pricingMode: PricingMode,
    marginMultiplier: number
  ): { sellPrice: number; sellPricePerM: number } {
    if (pricingMode === "contracted" && input.contractedPricePerM != null) {
      const sellPricePerM = input.contractedPricePerM;
      const sellPrice = (sellPricePerM * input.quantity) / 1000;
      return { sellPrice, sellPricePerM };
    }
    const sellPrice = costs.totalCost * marginMultiplier;
    const sellPricePerM = (sellPrice / Math.max(input.quantity, 1)) * 1000;
    return { sellPrice, sellPricePerM };
  }

  private buildMarginalLens(
    costs: CostBreakdown,
    quantity: number
  ): MarginalLens {
    const directLabor =
      costs.lines.find((l) => l.bucket === "directLabor")?.amount ?? 0;
    const idl =
      costs.lines.find((l) => l.bucket === "indirectLabor")?.amount ?? 0;
    const electricity =
      costs.lines.find((l) => l.bucket === "electricity")?.amount ?? 0;
    const indirectLaborPortion = idl * MARGINAL_IDL_PORTION;
    const total = directLabor + indirectLaborPortion + electricity;
    return {
      directLabor: round2(directLabor),
      indirectLaborPortion: round2(indirectLaborPortion),
      electricity: round2(electricity),
      total: round2(total),
      perM: round2((total / Math.max(quantity, 1)) * 1000),
      formula: "DL + 20% IDL + electricity",
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
