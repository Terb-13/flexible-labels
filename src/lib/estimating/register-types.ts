/** Normalized register snapshot used by the Memphis estimating engine. */

export interface SnapshotPlant {
  code: string;
  name: string;
  region?: string;
  routingMode: "live" | "pull_in" | "default";
}

export interface SnapshotAsset {
  assetTag: string;
  plantCode: string;
  status: string;
  equipmentType: string;
  equipNumber?: string;
  manufacturer?: string;
  model?: string;
  yearOfManufacture?: string;
  maxPrintDieWidthIn?: number;
  maxMaterialWidthIn?: number;
  widthIn?: number;
  colorStations?: number;
  maxSpeedFpm?: number;
  avgSpeedFpm?: number;
  avgMrMinutes?: number;
  avgMrMinutesPerColor?: number;
  capabilities: string[];
}

export interface SnapshotRouteStep {
  stepOrder: number;
  routeGroup: string;
  assetTag?: string;
  alias?: string;
  label: string;
}

export interface SnapshotRoute {
  id: string;
  plantCode: string;
  pressAssetTag: string;
  productType: string;
  productTypeRaw?: string;
  completeForm?: string;
  isActive: boolean;
  steps: SnapshotRouteStep[];
}

export interface RegisterSnapshot {
  version: 1;
  generatedAt: string;
  sourceFilename: string;
  plants: SnapshotPlant[];
  assets: SnapshotAsset[];
  routes: SnapshotRoute[];
  importSummary: {
    plantsUpserted: number;
    assetsUpserted: number;
    routesUpserted: number;
    stepsCreated: number;
    skipped: number;
    errors: string[];
  };
}

export const MEMPHIS_PLANT_CODE = "MEM-TN";
