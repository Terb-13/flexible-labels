import type { PlantAsset, QuoteSpec } from "@/types";

export interface RecommendedRoute {
  press: PlantAsset;
  finishing?: PlantAsset;
  rewind?: PlantAsset;
  laminator?: PlantAsset;
  across: number;
  runMinutes: number;
  labelsPerMinute: number;
  steps: string[];
  rationale: string[];
}

function isPress(asset: PlantAsset): boolean {
  return asset.kind === "press_flexo" || asset.kind === "press_digital";
}

function productHints(spec: QuoteSpec): string {
  return `${spec.productType} ${spec.finish ?? ""} ${spec.variableData ? "variable" : ""}`.toLowerCase();
}

function pressFits(press: PlantAsset, spec: QuoteSpec): boolean {
  if (spec.widthIn > press.maxWebWidthIn + 0.01) return false;
  if (spec.colors > press.colorStations) return false;
  return true;
}

function scorePress(press: PlantAsset, spec: QuoteSpec): number {
  const hints = productHints(spec);
  let score = 0;

  if (spec.variableData && press.capabilities.includes("variable_data")) score -= 80;
  if (spec.quantity < 5000 && press.kind === "press_digital") score -= 50;
  if (spec.quantity >= 15000 && press.kind === "press_flexo") score -= 40;
  if (spec.quantity >= 15000 && press.kind === "press_digital") score += 60;
  if (spec.quantity < 5000 && press.kind === "press_flexo") score += 35;

  if (hints.includes("tape") && press.capabilities.includes("tape")) score -= 30;
  if ((hints.includes("magnet") || hints.includes("die-cut") || hints.includes("sticker")) &&
      press.capabilities.includes("die_cut")) {
    score -= 20;
  }
  if (hints.includes("foil") && press.capabilities.includes("cold_foil")) score -= 15;

  // Prefer utilizing more of the web
  const across = Math.max(1, Math.floor(press.maxWebWidthIn / Math.max(spec.widthIn, 0.25)));
  const utilization = (across * spec.widthIn) / press.maxWebWidthIn;
  if (utilization < 0.35) score += 12;

  score += press.hourlyRate / 20;
  return score;
}

function labelsPerMinute(press: PlantAsset, spec: QuoteSpec, across: number): number {
  const pitch = Math.max(spec.heightIn, 0.25);
  return (press.avgSpeedFpm * 12 * across) / pitch;
}

/**
 * Pick the lowest-cost capable press plus finishing / rewind from the live registry.
 */
export function recommendRoute(
  spec: QuoteSpec,
  assets: PlantAsset[]
): RecommendedRoute {
  const active = assets.filter((a) => a.active);
  const presses = active.filter(isPress).filter((p) => pressFits(p, spec));

  if (!presses.length) {
    throw new Error(
      `No capable press in the Asset Registry for ${spec.widthIn}" web / ${spec.colors} colors.`
    );
  }

  const ranked = [...presses].sort((a, b) => scorePress(a, spec) - scorePress(b, spec));
  const press = ranked[0];
  const across = Math.max(1, Math.floor(press.maxWebWidthIn / Math.max(spec.widthIn, 0.25)));
  const lpm = labelsPerMinute(press, spec, across);
  const pressSetup =
    press.setupMinutes + spec.colors * press.setupMinutesPerColor;
  const pressRun = spec.quantity / Math.max(lpm, 1);

  const finishing = active.find((a) => a.kind === "finishing");
  const rewind = active.find((a) => a.kind === "rewind");
  const needsLaminate = Boolean(spec.finish && spec.finish !== "None");
  const laminator = needsLaminate
    ? active.find((a) => a.kind === "laminator")
    : undefined;

  const steps = [press.name];
  if (laminator) steps.push(laminator.name);
  if (finishing) steps.push(finishing.name);
  if (rewind) steps.push(rewind.name);

  const finishSetup =
    (finishing?.setupMinutes ?? 0) +
    (laminator?.setupMinutes ?? 0) +
    (rewind?.setupMinutes ?? 0);
  const runMinutes = pressSetup + pressRun + finishSetup;

  const rationale = [
    `${press.name} (${press.manufacturer} ${press.model}) is the ranked fit`,
    `${spec.widthIn}" across ${across}-up on a ${press.maxWebWidthIn}" web`,
    `${spec.colors} colors within ${press.colorStations} stations`,
    `Est. ${Math.round(runMinutes)} min including make-ready`,
  ];
  if (spec.variableData) {
    rationale.push("Variable data routed to a digital-capable asset");
  }
  if (spec.quantity < 5000 && press.kind === "press_digital") {
    rationale.push("Short run — digital preferred over flexo plates");
  }
  if (spec.quantity >= 15000 && press.kind === "press_flexo") {
    rationale.push("Volume run — flexo preferred for unit cost");
  }

  return {
    press,
    finishing,
    rewind,
    laminator,
    across,
    runMinutes,
    labelsPerMinute: lpm,
    steps,
    rationale,
  };
}
