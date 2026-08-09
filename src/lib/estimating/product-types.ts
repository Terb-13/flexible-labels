import type { ProductFamily } from "./types";

export type ProductTypeKey =
  | "ps_label"
  | "sheeted"
  | "variable_data"
  | "fanfold"
  | "shrink_sleeve"
  | "flex_pak"
  | "ecl"
  | "other";

const LABELS: Record<ProductTypeKey, string> = {
  ps_label: "Pressure-sensitive labels",
  sheeted: "Sheeted / die-cut",
  variable_data: "Variable data",
  fanfold: "Fanfold",
  shrink_sleeve: "Shrink sleeve",
  flex_pak: "Flexible packaging",
  ecl: "ECL",
  other: "Other",
};

export function productTypeLabel(key: string): string {
  return LABELS[key as ProductTypeKey] ?? key;
}

export function familyToProductTypes(family: ProductFamily): ProductTypeKey[] {
  switch (family) {
    case "pressure_sensitive":
      return ["ps_label", "sheeted", "variable_data", "fanfold"];
    case "shrink":
      return ["shrink_sleeve"];
    case "flex":
      return ["flex_pak", "ecl"];
    default:
      return ["other"];
  }
}

export function productToFamily(productType: string): ProductFamily {
  if (["shrink_sleeve"].includes(productType)) return "shrink";
  if (["flex_pak", "ecl"].includes(productType)) return "flex";
  return "pressure_sensitive";
}

/** Map FLG marketing product names → register product types */
export function mapProductLabelToType(label: string): ProductTypeKey {
  const n = label.toLowerCase();
  if (n.includes("variable")) return "variable_data";
  if (
    n.includes("die-cut") ||
    n.includes("die cut") ||
    n.includes("sticker") ||
    n.includes("magnet") ||
    n.includes("bumper") ||
    n.includes("decal")
  ) {
    return "sheeted";
  }
  if (n.includes("shrink")) return "shrink_sleeve";
  if (n.includes("tape") || n.includes("flex")) return "flex_pak";
  return "ps_label";
}
