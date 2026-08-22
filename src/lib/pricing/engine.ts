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
  QuoteSpec,
  RouteCostLine,
} from "@/types";

const STAGE_ORDER: EquipmentStage[] = [
  "printer",
  "seamer",
  "finisher",
  "shipping",
];

export function normalizeSpec(spec: QuoteSpec): QuoteSpec {
  return {
    product: spec.product || spec.productType || "Roll Labels",
    type: spec.type || "Prime / pressure-sensitive",
    material: spec.material,
    widthIn: Number(spec.widthIn) || 0,
    heightIn: Number(spec.heightIn) || 0,
    quantity: Number(spec.quantity) || 0,
    colors: Number(spec.colors) || 1,
    finish: spec.finish,
    variableData: Boolean(spec.variableData),
    repeatIn: Number(spec.repeatIn) || 0,
    across: Number(spec.across) || 0,
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
export function calculateQuote(
  rawSpec: QuoteSpec,
  company: Pick<
    Company,
    "margin_percent" | "target_margin_percent" | "is_reseller" | "discount_percent"
  >,
  catalog: PricingCatalog
): QuoteBreakdown {
  const spec = normalizeSpec(rawSpec);
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
