/**
 * Core estimating types — pure data contracts for the deterministic engine.
 */

export type ProductFamily = "pressure_sensitive" | "shrink" | "flex";

export type PricingMode = "cost_plus" | "contracted";

export type RoleView = "customer" | "cx" | "ep";

export type RouteTier = "good" | "better" | "best";

export type CostBucketKey =
  | "material"
  | "ink"
  | "directLabor"
  | "indirectLabor"
  | "electricity"
  | "tooling"
  | "setup"
  | "finishing"
  | "freight"
  | "other";

export interface Dimensions {
  widthIn: number;
  lengthIn: number;
  depthIn?: number;
}

export interface MaterialSpec {
  id: string;
  name: string;
  family: ProductFamily;
  /** $/MSI (thousand square inches) */
  costPerMsi: number;
  caliperMil?: number;
  supplier?: string;
}

export interface InkSpec {
  colors: number;
  costPerMsi?: number;
}

export interface FinishingSpec {
  laminate?: boolean;
  varnish?: boolean;
  dieCut?: boolean;
  rewind?: boolean;
}

export interface EstimateInput {
  estimateId?: string;
  customerId?: string;
  family: ProductFamily;
  quantity: number;
  dimensions: Dimensions;
  material: MaterialSpec;
  ink?: InkSpec;
  finishing?: FinishingSpec;
  plantId?: string;
  pressId?: string;
  pricingMode?: PricingMode;
  marginMultiplier?: number;
  contractedPricePerM?: number;
  across?: number;
  preferredTier?: RouteTier;
  /** Product type key matching register routes, e.g. ps_label */
  productType?: string;
}

export interface CostLine {
  bucket: CostBucketKey;
  label: string;
  amount: number;
  notes?: string;
}

export interface CostBreakdown {
  lines: CostLine[];
  totalCost: number;
  costPerM: number;
}

export interface MarginalLens {
  directLabor: number;
  indirectLaborPortion: number;
  electricity: number;
  total: number;
  perM: number;
  formula: "DL + 20% IDL + electricity";
}

export interface PlantAsset {
  id: string;
  name: string;
  code: string;
  region?: string;
}

export interface PressAsset {
  id: string;
  plantId: string;
  name: string;
  families: ProductFamily[];
  maxWidthIn: number;
  speedFpm: number;
  maxColors: number;
  hourlyRate: number;
  electricityPerHour: number;
  setupMinutes: number;
  setupMinutesPerColor?: number;
  rank: number;
  assetTag?: string;
}

export interface FinishingRouteAsset {
  id: string;
  plantId: string;
  name: string;
  families: ProductFamily[];
  speedFactor: number;
  hourlyRate: number;
  setupMinutes: number;
  capabilities: Array<"laminate" | "varnish" | "dieCut" | "rewind">;
  rank: number;
}

export interface ResolvedRoute {
  tier: RouteTier;
  plant: PlantAsset;
  press: PressAsset;
  finishing?: FinishingRouteAsset;
  productionRouteId?: string;
  finishingSteps?: string[];
  across?: number;
  webWidthIn?: number;
  runMinutes: number;
  labelsPerMinute: number;
  score: number;
  rationale: string[];
}

export interface PricedEstimate {
  input: EstimateInput;
  route: ResolvedRoute;
  costs: CostBreakdown;
  pricingMode: PricingMode;
  sellPrice: number;
  sellPricePerM: number;
  marginMultiplier: number;
  grossMargin: number;
  grossMarginPct: number;
  marginal: MarginalLens;
  totalSquareInches: number;
  computedAt: string;
}

export interface RoleFilteredEstimate {
  role: RoleView;
  sellPrice: number;
  sellPricePerM: number;
  quantity: number;
  routeSummary: {
    plantName: string;
    pressName: string;
    finishingName?: string;
    tier: RouteTier;
  };
  summary?: {
    totalCost?: number;
    costPerM?: number;
    grossMargin?: number;
    grossMarginPct?: number;
    pricingMode: PricingMode;
  };
  costs?: CostBreakdown;
  marginal?: MarginalLens;
  rationale?: string[];
}
