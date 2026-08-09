import type { ProductFamily } from "./types";
import type { WizardProductType } from "./wizard-store";

export interface CatalogMaterial {
  id: string;
  label: string;
  costPerMsi: number;
  family: ProductFamily;
}

export const MATERIAL_CATALOG: Record<WizardProductType, CatalogMaterial[]> = {
  prime_label: [
    { id: "matte-bopp", label: "Matte BOPP", costPerMsi: 0.42, family: "pressure_sensitive" },
    { id: "gloss-bopp", label: "Gloss BOPP", costPerMsi: 0.45, family: "pressure_sensitive" },
    { id: "white-paper", label: "White paper TC", costPerMsi: 0.32, family: "pressure_sensitive" },
    { id: "clear-pp", label: "Clear PP", costPerMsi: 0.55, family: "pressure_sensitive" },
    { id: "vinyl-white", label: "White vinyl", costPerMsi: 0.68, family: "pressure_sensitive" },
  ],
  die_cut: [
    { id: "matte-bopp", label: "Matte BOPP", costPerMsi: 0.42, family: "pressure_sensitive" },
    { id: "gloss-paper", label: "Gloss paper", costPerMsi: 0.35, family: "pressure_sensitive" },
    { id: "vinyl-white", label: "White vinyl", costPerMsi: 0.68, family: "pressure_sensitive" },
  ],
  variable_data: [
    { id: "matte-bopp", label: "Matte BOPP", costPerMsi: 0.42, family: "pressure_sensitive" },
    { id: "thermal-transfer", label: "Thermal transfer", costPerMsi: 0.38, family: "pressure_sensitive" },
  ],
  bumper: [
    { id: "vinyl-white", label: "White vinyl", costPerMsi: 0.72, family: "pressure_sensitive" },
    { id: "vinyl-clear", label: "Clear vinyl", costPerMsi: 0.78, family: "pressure_sensitive" },
  ],
  magnet: [
    { id: "magnet-20", label: "0.020\" magnet", costPerMsi: 1.15, family: "pressure_sensitive" },
  ],
};

export const SAMPLE_RFP = `Please quote 25,000 roll labels, 2.25" x 3.5", 4-color process on matte BOPP, rewind on 3" cores, ship to Memphis. Need by 3 weeks.`;
