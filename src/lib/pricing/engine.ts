import {
  plannedPressHours,
  productionFeet,
  roundHours,
} from "@/lib/erp/press-time";
import type {
  Company,
  Equipment,
  EquipmentStage,
  Material,
  PricingCatalog,
  ProductionRoute,
  QuoteBreakdown,
  QuoteBreakResult,
  QuoteEstimate,
  QuoteSpec,
  RouteCostLine,
} from "@/types";

const STAGE_ORDER: EquipmentStage[] = [
  "printer",
  "seamer",
  "finisher",
  "shipping",
];

/** Ink stations: front + back + optional white plate + varnish. */
export function stationCount(spec: QuoteSpec): number {
  const hasStations =
    spec.frontColors != null ||
    spec.backColors != null ||
    spec.whitePlate ||
    spec.varnish;
  if (hasStations) {
    return (
      (Number(spec.frontColors) || 0) +
      (Number(spec.backColors) || 0) +
      (spec.whitePlate ? 1 : 0) +
      (spec.varnish ? 1 : 0)
    );
  }
  return Number(spec.colors) || 0;
}

export function validQtyBreaks(spec: QuoteSpec): number[] {
  const breaks = (spec.qtyBreaks ?? [])
    .map((n) => Number(n) || 0)
    .filter((n) => n > 0)
    .slice(0, 7);
  if (breaks.length) return breaks;
  const qty = Number(spec.quantity) || 0;
  return qty > 0 ? [qty] : [];
}

/** Quantities to send through calculateQuote: sum if grouped, else each break. */
export function pricedQuantities(spec: QuoteSpec): number[] {
  const breaks = validQtyBreaks(spec);
  if (!breaks.length) return [];
  if (spec.grouped) {
    return [breaks.reduce((sum, n) => sum + n, 0)];
  }
  return breaks;
}

export function normalizeSpec(spec: QuoteSpec): QuoteSpec {
  const colors = stationCount(spec) || Number(spec.colors) || 0;
  const features = spec.features ?? [];
  const variableData =
    Boolean(spec.variableData) ||
    features.some((f) => /variable|serial|qr/i.test(f));
  const heightIn = Number(spec.heightIn) || 0;
  return {
    ...spec,
    product: spec.product || spec.productType || "Roll Labels",
    type: spec.type || "Prime / pressure-sensitive",
    material: spec.material,
    widthIn: Number(spec.widthIn) || 0,
    heightIn,
    quantity: Number(spec.quantity) || 0,
    colors: colors || 1,
    finish: spec.finish || spec.premiumFinishes?.[0],
    variableData,
    repeatIn: Number(spec.repeatIn) || heightIn || 0,
    across: Number(spec.across) || 0,
    qtyBreaks: spec.qtyBreaks,
    grouped: Boolean(spec.grouped),
  };
}

export function matchRoute(
  spec: QuoteSpec,
  routes: ProductionRoute[]
): ProductionRoute {
  const scored = routes.map((route) => {
    const match = route.match_attributes ?? {};
    let score = route.is_default ? 1 : 10;
    let ok = true;

    if (match.products?.length) {
      if (match.products.includes(spec.product)) score += 5;
      else ok = false;
    }
    if (match.types?.length) {
      if (match.types.includes(spec.type)) score += 3;
      else ok = false;
    }
    if (match.materials?.length) {
      if (match.materials.includes(spec.material)) score += 4;
      else ok = false;
    }
    if (match.min_quantity != null && spec.quantity < match.min_quantity) {
      ok = false;
    }
    if (match.max_quantity != null && spec.quantity > match.max_quantity) {
      ok = false;
    }

    return { route, score: ok ? score : -1 };
  });

  const winner = scored
    .filter((s) => s.score >= 0)
    .sort((a, b) => b.score - a.score)[0];

  return (
    winner?.route ??
    routes.find((r) => r.is_default) ??
    routes[0]
  );
}

export function qualifyEquipment(
  stage: EquipmentStage,
  spec: QuoteSpec,
  equipment: Equipment[]
): Equipment | null {
  const candidates = equipment.filter((eq) => {
    if (eq.stage !== stage || eq.active === false) return false;
    const cap = eq.capabilities ?? {};
    if (cap.products?.length && !cap.products.includes(spec.product)) {
      return false;
    }
    if (cap.types?.length && !cap.types.includes(spec.type)) return false;
    if (cap.materials?.length && !cap.materials.includes(spec.material)) {
      return false;
    }
    if (cap.max_width_in != null && spec.widthIn > cap.max_width_in) {
      return false;
    }
    if (cap.max_colors != null && spec.colors > cap.max_colors) return false;
    return true;
  });

  if (candidates.length === 0) {
    return (
      equipment.find((eq) => eq.stage === stage && eq.active !== false) ?? null
    );
  }

  return candidates.sort((a, b) => a.cost_rate - b.cost_rate)[0];
}

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

function findSubstrate(spec: QuoteSpec, materials: Material[]): Material | null {
  const substrates = materials.filter(
    (m) => m.kind === "substrate" && m.active !== false
  );
  const exact = substrates.find(
    (m) => m.name.toLowerCase() === spec.material.toLowerCase()
  );
  if (exact) return exact;
  return (
    substrates.find((m) =>
      spec.material.toLowerCase().includes(m.name.toLowerCase())
    ) ??
    substrates[0] ??
    null
  );
}

function findDye(materials: Material[]): Material | null {
  return (
    materials.find((m) => m.kind === "dye" && m.active !== false) ?? null
  );
}

function stepHours(equipment: Equipment, spec: QuoteSpec): {
  hours: number;
  productionFeet: number;
} {
  if (equipment.stage === "printer") {
    const feet = productionFeet(spec.quantity, spec.across, spec.repeatIn);
    const fpm = equipment.run_speed_fpm ?? 0;
    return {
      hours: plannedPressHours(equipment.setup_time_minutes, feet, fpm),
      productionFeet: feet,
    };
  }
  const setupHours = equipment.setup_time_minutes / 60;
  const speed = equipment.run_speed > 0 ? equipment.run_speed : 1;
  const runHours = (spec.quantity / speed) * (1 + equipment.waste_percent / 100);
  return { hours: setupHours + runHours, productionFeet: 0 };
}

/**
 * Cost-plus from catalog lookups + the company’s type/margin/discount.
 * Catalog rates must be treated as EXAMPLE unless replaced in Supabase.
 */
/** Engine-chosen across. Always re-picks — a stale client value is not a lock. */
export function withAutoAcross(
  rawSpec: QuoteSpec,
  company: Pick<
    Company,
    "margin_percent" | "target_margin_percent" | "is_reseller" | "discount_percent"
  >,
  catalog: PricingCatalog
): QuoteSpec {
  const spec = normalizeSpec({ ...rawSpec, across: 0 });
  const picked = calculateLayouts({ ...spec, across: 1 }, company, catalog)[0];
  return { ...spec, across: picked?.across ?? 1 };
}

export function calculateQuote(
  rawSpec: QuoteSpec,
  company: Pick<
    Company,
    "margin_percent" | "target_margin_percent" | "is_reseller" | "discount_percent"
  >,
  catalog: PricingCatalog
): QuoteBreakdown {
  let spec = normalizeSpec(rawSpec);
  if (!(spec.across > 0)) {
    spec = withAutoAcross(spec, company, catalog);
  }
  const route = matchRoute(spec, catalog.routes);
  const orderedSteps = [...(route?.steps ?? [])].sort(
    (a, b) => a.step_order - b.step_order
  );
  const stages = orderedSteps.length
    ? orderedSteps.map((s) => s.stage)
    : STAGE_ORDER;

  const substrate = findSubstrate(spec, catalog.materials);
  const dye = findDye(catalog.materials);
  const printer = qualifyEquipment("printer", spec, catalog.equipment);
  const wasteFactor = 1 + (printer?.waste_percent ?? 0) / 100;
  const sqIn = spec.widthIn * spec.heightIn * spec.quantity * wasteFactor;

  const substrateCost = money(sqIn * (substrate?.cost_per_sqin ?? 0));
  const dyeCost = money(
    ((dye?.cost_per_unit ?? 0) * spec.colors * spec.quantity) / 1000
  );
  const materialCost = money(substrateCost + dyeCost);

  const lines: RouteCostLine[] = stages.map((stage) => {
    const equipment = qualifyEquipment(stage, spec, catalog.equipment);
    if (!equipment) {
      return {
        stage,
        equipmentId: "",
        equipmentName: `Unqualified ${stage}`,
        hours: 0,
        cost: 0,
        qualified: false,
        setupMinutes: 0,
        wastePercent: 0,
      };
    }
    const timed = stepHours(equipment, spec);
    return {
      stage,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      hours: roundHours(timed.hours),
      cost: money(timed.hours * equipment.cost_rate),
      qualified: true,
      setupMinutes: equipment.setup_time_minutes,
      wastePercent: equipment.waste_percent,
      productionFeet:
        stage === "printer" ? roundHours(timed.productionFeet) : undefined,
      runSpeedUnit: equipment.run_speed_unit,
    };
  });

  const costByStage = (stage: EquipmentStage) =>
    lines.find((l) => l.stage === stage)?.cost ?? 0;

  const pressCost = costByStage("printer");
  const seamerCost = costByStage("seamer");
  const finishingCost = costByStage("finisher");
  const shippingCost = costByStage("shipping");
  const setupCost = money(
    lines.reduce((sum, line) => {
      const eq = catalog.equipment.find((e) => e.id === line.equipmentId);
      if (!eq) return sum;
      return sum + (eq.setup_time_minutes / 60) * eq.cost_rate;
    }, 0)
  );

  const totalCost = money(
    materialCost + pressCost + seamerCost + finishingCost + shippingCost
  );

  const discountPercent = company.discount_percent ?? 0;
  const listPrice = totalCost * (1 + company.margin_percent / 100);
  const finalPrice = money(listPrice * (1 - discountPercent / 100));
  const marginAmount = money(finalPrice - totalCost);
  const actualMarginPercent =
    finalPrice > 0 ? Math.round((marginAmount / finalPrice) * 1000) / 10 : 0;
  const needsApproval = actualMarginPercent < company.target_margin_percent;
  const printerLine = lines.find((l) => l.stage === "printer");

  return {
    materialCost,
    substrateCost,
    dyeCost,
    pressCost,
    seamerCost,
    finishingCost,
    shippingCost,
    setupCost,
    totalCost,
    marginPercent: actualMarginPercent,
    finalPrice,
    marginAmount,
    needsApproval,
    targetMarginPercent: company.target_margin_percent,
    discountPercent,
    companyMarginPercent: company.margin_percent,
    routeName: route?.name ?? "Unrouted",
    routeId: route?.id ?? "",
    lines,
    catalogSource: catalog.source,
    productionFeet: printerLine?.productionFeet ?? 0,
    plannedPressHours: printerLine?.hours ?? 0,
    viable: isViableSpec(spec, catalog),
  };
}

/**
 * True when a press actually qualifies — no fallback to an unqualified machine.
 * Used for the estimate empty state. Does not invent web widths or FPM.
 */
export function isViableSpec(spec: QuoteSpec, catalog: PricingCatalog): boolean {
  if (!(spec.widthIn > 0) || !(spec.heightIn > 0) || !(spec.quantity > 0)) {
    return false;
  }
  if (!spec.product || !spec.material) return false;
  return catalog.equipment.some((eq) => {
    if (eq.stage !== "printer" || eq.active === false) return false;
    const cap = eq.capabilities ?? {};
    if (cap.products?.length && !cap.products.includes(spec.product)) {
      return false;
    }
    if (cap.types?.length && spec.type && !cap.types.includes(spec.type)) {
      return false;
    }
    if (cap.materials?.length && !cap.materials.includes(spec.material)) {
      return false;
    }
    if (cap.max_width_in != null && spec.widthIn > cap.max_width_in) {
      return false;
    }
    if (cap.max_colors != null && spec.colors > cap.max_colors) return false;
    return true;
  });
}

/** Geometric fit only — not a stocked-web price table. */
const LAYOUT_TRIM_IN = 0.25;
const LAYOUT_GAP_IN = 0.125;

export function webInchesForAcross(widthIn: number, across: number): number {
  if (!(widthIn > 0) || !(across > 0)) return 0;
  return across * widthIn + Math.max(0, across - 1) * LAYOUT_GAP_IN + 2 * LAYOUT_TRIM_IN;
}

export function viableAcrossValues(spec: QuoteSpec, catalog: PricingCatalog): number[] {
  const printers = catalog.equipment.filter(
    (eq) => eq.stage === "printer" && eq.active !== false
  );
  const withWeb = printers.filter((eq) => eq.capabilities?.max_width_in != null);
  if (!withWeb.length || !(spec.widthIn > 0)) return [];

  const fits = (across: number) => {
    const web = webInchesForAcross(spec.widthIn, across);
    return withWeb.some((eq) => {
      const cap = eq.capabilities ?? {};
      if (cap.products?.length && spec.product && !cap.products.includes(spec.product)) {
        return false;
      }
      if (cap.materials?.length && spec.material && !cap.materials.includes(spec.material)) {
        return false;
      }
      return web <= (cap.max_width_in ?? 0);
    });
  };

  return [1, 2, 3, 4, 5, 6].filter(fits);
}

export function calculateLayouts(
  rawSpec: QuoteSpec,
  company: Pick<
    Company,
    "margin_percent" | "target_margin_percent" | "is_reseller" | "discount_percent"
  >,
  catalog: PricingCatalog
) {
  return viableAcrossValues(rawSpec, catalog)
    .map((across) => {
      const breakdown = calculateQuote({ ...rawSpec, across }, company, catalog);
      return {
        across,
        webIn: webInchesForAcross(rawSpec.widthIn, across),
        breakdown,
        viable: breakdown.viable !== false,
      };
    })
    .sort((a, b) => a.breakdown.finalPrice - b.breakdown.finalPrice);
}

export function calculateQuoteBreaks(
  rawSpec: QuoteSpec,
  company: Pick<
    Company,
    "margin_percent" | "target_margin_percent" | "is_reseller" | "discount_percent"
  >,
  catalog: PricingCatalog
): QuoteEstimate {
  const quantities = pricedQuantities(rawSpec);
  const breaks: QuoteBreakResult[] = quantities.map((quantity) => {
    const breakdown = calculateQuote(
      { ...rawSpec, quantity },
      company,
      catalog
    );
    return {
      quantity,
      breakdown,
      viable: breakdown.viable !== false,
    };
  });
  const primary = breaks[0]?.breakdown ?? null;
  return {
    grouped: Boolean(rawSpec.grouped),
    quantities: validQtyBreaks(rawSpec),
    pricedQuantity: quantities[0] ?? 0,
    breaks,
    primary,
    viable: breaks.some((b) => b.viable),
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
