import type { RegisterSnapshot, SnapshotAsset } from "./register-types";
import { MEMPHIS_PLANT_CODE } from "./register-types";
import { familyToProductTypes } from "./product-types";
import type {
  EstimateInput,
  FinishingRouteAsset,
  PlantAsset,
  PressAsset,
  ResolvedRoute,
  RouteTier,
} from "./types";

const TIERS: RouteTier[] = ["best", "better", "good"];

function isPress(a: SnapshotAsset): boolean {
  return a.equipmentType.toLowerCase().includes("press");
}

function isFinisher(a: SnapshotAsset): boolean {
  const t = a.equipmentType.toLowerCase();
  return (
    t.includes("finisher") ||
    t.includes("rewinder") ||
    t.includes("laminator")
  );
}

function pressFromAsset(a: SnapshotAsset, rank: number): PressAsset {
  const digital = a.equipmentType.toLowerCase().includes("digital");
  return {
    id: a.assetTag,
    plantId: a.plantCode,
    name: a.equipNumber || `${a.manufacturer ?? ""} ${a.model ?? a.assetTag}`.trim(),
    families: ["pressure_sensitive", "shrink", "flex"],
    maxWidthIn: a.maxMaterialWidthIn ?? a.widthIn ?? 13,
    speedFpm: a.avgSpeedFpm ?? a.maxSpeedFpm ?? (digital ? 90 : 350),
    maxColors: a.colorStations ?? (digital ? 7 : 6),
    hourlyRate: digital ? 185 : 220,
    electricityPerHour: digital ? 18 : 28,
    setupMinutes: a.avgMrMinutes ?? (digital ? 18 : 45),
    setupMinutesPerColor: a.avgMrMinutesPerColor ?? (digital ? 2 : 8),
    rank,
    assetTag: a.assetTag,
  };
}

function finishingFromAsset(a: SnapshotAsset, rank: number): FinishingRouteAsset {
  const caps: Array<"laminate" | "varnish" | "dieCut" | "rewind"> = [];
  for (const raw of a.capabilities ?? []) {
    const c = raw.toLowerCase();
    if (c === "laminate") caps.push("laminate");
    else if (c === "varnish") caps.push("varnish");
    else if (c === "diecut" || c === "die_cut" || c === "die-cut")
      caps.push("dieCut");
    else if (c === "rewind") caps.push("rewind");
  }

  return {
    id: a.assetTag,
    plantId: a.plantCode,
    name: a.equipNumber || a.equipmentType,
    families: ["pressure_sensitive", "shrink", "flex"],
    speedFactor: 0.85,
    hourlyRate: 95,
    setupMinutes: a.avgMrMinutes ?? 20,
    capabilities:
      caps.length > 0 ? caps : ["dieCut", "rewind", "laminate"],
    rank,
  };
}

export class RouteResolver {
  private readonly plants: PlantAsset[];
  private readonly presses: PressAsset[];
  private readonly finishers: FinishingRouteAsset[];
  private readonly snapshot: RegisterSnapshot;

  constructor(snapshot: RegisterSnapshot) {
    this.snapshot = snapshot;
    this.plants = snapshot.plants.map((p) => ({
      id: p.code,
      name: p.name,
      code: p.code,
      region: p.region,
    }));

    const installed = snapshot.assets.filter((a) => a.status === "Installed");
    this.presses = installed
      .filter(isPress)
      .map((a, i) => pressFromAsset(a, i + 1));
    this.finishers = installed
      .filter(isFinisher)
      .map((a, i) => finishingFromAsset(a, i + 1));
  }

  resolve(input: EstimateInput, opts: { limit?: number } = {}): ResolvedRoute[] {
    const limit = opts.limit ?? 3;
    const plantId = input.plantId ?? MEMPHIS_PLANT_CODE;
    const plant =
      this.plants.find((p) => p.id === plantId || p.code === plantId) ??
      this.plants[0];
    if (!plant) return [];

    const productTypes = input.productType
      ? [input.productType]
      : familyToProductTypes(input.family);

    const activeRoutes = this.snapshot.routes.filter(
      (r) =>
        r.isActive &&
        r.plantCode === plant.code &&
        productTypes.includes(r.productType)
    );

    const width = input.dimensions.widthIn;
    const colors = input.ink?.colors ?? 4;
    const qty = input.quantity;

    const scored: ResolvedRoute[] = [];

    for (const route of activeRoutes) {
      const press =
        this.presses.find((p) => p.id === route.pressAssetTag) ??
        this.presses.find((p) => p.assetTag === route.pressAssetTag);
      if (!press) continue;
      if (input.pressId && press.id !== input.pressId) continue;
      if (width > press.maxWidthIn + 0.01) continue;
      if (colors > press.maxColors) continue;

      const finishTag = route.steps
        .slice()
        .reverse()
        .find((s) => s.assetTag && s.assetTag !== press.id)?.assetTag;
      const finishing = finishTag
        ? this.finishers.find((f) => f.id === finishTag)
        : this.finishers[0];

      const across = input.across ?? Math.max(1, Math.floor(press.maxWidthIn / Math.max(width, 0.5)));
      const webWidthIn = Math.min(press.maxWidthIn, across * width + 0.25);
      const labelsPerRev = across;
      const feetPerMin = press.speedFpm;
      const labelsPerMinute =
        (feetPerMin * 12 * labelsPerRev) / Math.max(input.dimensions.lengthIn, 0.25);

      const setup =
        press.setupMinutes +
        colors * (press.setupMinutesPerColor ?? 0) +
        (finishing?.setupMinutes ?? 0);
      const runMinutes = setup + qty / Math.max(labelsPerMinute, 1);

      const rationale: string[] = [
        `${press.name} fits ${width}" across (${across}-up)`,
        `${colors} colors ≤ ${press.maxColors} stations`,
        `Est. ${Math.round(runMinutes)} min including make-ready`,
      ];
      if (qty < 5000 && press.name.toLowerCase().includes("digital")) {
        rationale.push("Digital preferred for short run");
      }
      if (qty >= 15000 && !press.name.toLowerCase().includes("digital")) {
        rationale.push("Flexo preferred for volume");
      }

      // Lower score is better
      let score = runMinutes;
      score += press.rank * 5;
      if (qty < 5000 && !press.name.toLowerCase().includes("digital")) score += 40;
      if (qty >= 15000 && press.name.toLowerCase().includes("digital")) score += 50;
      if (webWidthIn / press.maxWidthIn < 0.4) score += 15;

      scored.push({
        tier: "good",
        plant,
        press,
        finishing,
        productionRouteId: route.id,
        finishingSteps: route.steps.map((s) => s.label),
        across,
        webWidthIn,
        runMinutes,
        labelsPerMinute,
        score,
        rationale,
      });
    }

    // Fallback: any capable press if no route rows matched
    if (!scored.length) {
      for (const press of this.presses.filter((p) => p.plantId === plant.code)) {
        if (width > press.maxWidthIn || colors > press.maxColors) continue;
        const across = Math.max(1, Math.floor(press.maxWidthIn / Math.max(width, 0.5)));
        const labelsPerMinute =
          (press.speedFpm * 12 * across) / Math.max(input.dimensions.lengthIn, 0.25);
        const setup =
          press.setupMinutes + colors * (press.setupMinutesPerColor ?? 0);
        const runMinutes = setup + qty / Math.max(labelsPerMinute, 1);
        scored.push({
          tier: "good",
          plant,
          press,
          finishing: this.finishers[0],
          across,
          webWidthIn: Math.min(press.maxWidthIn, across * width),
          runMinutes,
          labelsPerMinute,
          score: runMinutes + press.rank * 5,
          rationale: [`Fallback route on ${press.name}`],
        });
      }
    }

    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, limit).map((r, i) => ({
      ...r,
      tier: TIERS[i] ?? "good",
    }));
  }

  resolveBest(input: EstimateInput): ResolvedRoute {
    const routes = this.resolve(input, { limit: 1 });
    if (!routes.length) {
      throw new Error(
        "No production route available for this job at Memphis. Check width/colors against the asset register."
      );
    }
    return routes[0];
  }

  resolveLayouts(input: EstimateInput): ResolvedRoute[] {
    const base = this.resolveBest(input);
    const maxAcross = Math.max(
      1,
      Math.floor(base.press.maxWidthIn / Math.max(input.dimensions.widthIn, 0.5))
    );
    const layouts = [1, 2, 3, 4].filter((n) => n <= maxAcross);
    return layouts.map((across) => {
      const labelsPerMinute =
        (base.press.speedFpm * 12 * across) /
        Math.max(input.dimensions.lengthIn, 0.25);
      const setup =
        base.press.setupMinutes +
        (input.ink?.colors ?? 4) * (base.press.setupMinutesPerColor ?? 0) +
        (base.finishing?.setupMinutes ?? 0);
      const runMinutes = setup + input.quantity / Math.max(labelsPerMinute, 1);
      return {
        ...base,
        across,
        webWidthIn: Math.min(
          base.press.maxWidthIn,
          across * input.dimensions.widthIn + 0.25
        ),
        labelsPerMinute,
        runMinutes,
        score: runMinutes,
        rationale: [`${across}-across layout on ${base.press.name}`],
      };
    });
  }
}
