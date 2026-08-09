import { create } from "zustand";
import type { RoleView } from "./types";
import { mapProductLabelToType, productToFamily } from "./product-types";

export type WizardProductType =
  | "prime_label"
  | "die_cut"
  | "variable_data"
  | "bumper"
  | "magnet";

export function wizardProductToRegisterType(
  productType: WizardProductType
): string {
  switch (productType) {
    case "variable_data":
      return "variable_data";
    case "die_cut":
    case "bumper":
    case "magnet":
      return "sheeted";
    default:
      return "ps_label";
  }
}

export function productToFamilyFromWizard(productType: WizardProductType) {
  return productToFamily(wizardProductToRegisterType(productType));
}

interface WizardState {
  role: RoleView;
  step: number;
  productType: WizardProductType | null;
  materialId: string | null;
  materialLabel: string | null;
  materialCostPerMsi: number | null;
  widthIn: number;
  lengthIn: number;
  colors: number;
  quantity: number;
  laminate: boolean;
  varnish: boolean;
  dieCut: boolean;
  rewind: boolean;
  customerName: string;
  marginMultiplier: number;
  estimateId: string | null;
  setRole: (role: RoleView) => void;
  setStep: (step: number) => void;
  setProductType: (t: WizardProductType) => void;
  setMaterial: (id: string, label: string, costPerMsi: number) => void;
  setSize: (widthIn: number, lengthIn: number) => void;
  setColors: (n: number) => void;
  setQuantity: (n: number) => void;
  setFinishing: (patch: Partial<{
    laminate: boolean;
    varnish: boolean;
    dieCut: boolean;
    rewind: boolean;
  }>) => void;
  setCustomerName: (name: string) => void;
  setMarginMultiplier: (n: number) => void;
  setEstimateId: (id: string | null) => void;
  reset: () => void;
  applyParsed: (parsed: {
    productType?: string;
    widthIn?: number;
    heightIn?: number;
    quantity?: number;
    colors?: number;
    material?: string;
  }) => void;
}

const initial = {
  role: "cx" as RoleView,
  step: 0,
  productType: "prime_label" as WizardProductType | null,
  materialId: "matte-bopp",
  materialLabel: "Matte BOPP",
  materialCostPerMsi: 0.42,
  widthIn: 2.25,
  lengthIn: 3.5,
  colors: 4,
  quantity: 10000,
  laminate: false,
  varnish: false,
  dieCut: true,
  rewind: true,
  customerName: "",
  marginMultiplier: 1.35,
  estimateId: null as string | null,
};

export const useWizardStore = create<WizardState>((set) => ({
  ...initial,
  setRole: (role) => set({ role }),
  setStep: (step) => set({ step }),
  setProductType: (productType) => set({ productType }),
  setMaterial: (materialId, materialLabel, materialCostPerMsi) =>
    set({ materialId, materialLabel, materialCostPerMsi }),
  setSize: (widthIn, lengthIn) => set({ widthIn, lengthIn }),
  setColors: (colors) => set({ colors }),
  setQuantity: (quantity) => set({ quantity }),
  setFinishing: (patch) => set(patch),
  setCustomerName: (customerName) => set({ customerName }),
  setMarginMultiplier: (marginMultiplier) => set({ marginMultiplier }),
  setEstimateId: (estimateId) => set({ estimateId }),
  reset: () => set({ ...initial }),
  applyParsed: (parsed) =>
    set((s) => {
      let productType = s.productType;
      if (parsed.productType) {
        const mapped = mapProductLabelToType(parsed.productType);
        if (mapped === "variable_data") productType = "variable_data";
        else if (mapped === "sheeted") productType = "die_cut";
        else productType = "prime_label";
      }
      return {
        productType,
        widthIn: parsed.widthIn ?? s.widthIn,
        lengthIn: parsed.heightIn ?? s.lengthIn,
        quantity: parsed.quantity ?? s.quantity,
        colors: parsed.colors ?? s.colors,
        materialLabel: parsed.material ?? s.materialLabel,
      };
    }),
}));

export { productToFamily };
