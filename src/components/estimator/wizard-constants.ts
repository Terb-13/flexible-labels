import type { ColorMethod, LabelShape, ParsedDocumentSpec, QuoteSpec } from "@/types";

export const STEP_LABELS = [
  "Product",
  "Material",
  "Size",
  "Colors",
  "Specs",
  "Quantity",
  "Estimate",
] as const;

export const STEP_TITLES = [
  "What are we making?",
  "Choose your material",
  "Label dimensions",
  "Artwork & Colors",
  "Specifications & Options",
  "How many do you need?",
  "Production Estimate",
] as const;

export const STEP_SUBTITLES = [
  "Select the product category to get started.",
  "Pick the substrate this job can actually run on.",
  "Finished size in inches. Repeat and across drive press footage.",
  "Upload artwork to extract colors, or configure stations manually.",
  "Capture finishes and production specs — only catalog-priced fields hit the engine.",
  "Enter up to 7 quantity breaks. Group them as a family run, or price each independently.",
  "Live result from the cost-plus engine. Budgetary until review.",
] as const;

export const QTY_PRESETS = [1000, 5000, 10000, 25000, 50000, 100000, 250000];

export const PREMIUM_FINISHES = [
  "Silver foil",
  "Gold foil",
  "Holographic foil",
  "Gloss lamination",
  "Matte lamination",
  "Soft-touch lamination",
];

export const SHAPES: [LabelShape, string][] = [
  ["rectangle", "Rectangle"],
  ["oval", "Oval"],
  ["circle", "Circle"],
  ["square", "Square"],
];

export const UNWIND_DIRS: Record<number, string> = {
  1: "Top first",
  2: "Bottom first",
  3: "Right first",
  4: "Left first",
};

export const FEATURES = [
  "Variable data",
  "Barcode",
  "RFID",
  "Booklet",
  "Mosaic",
  "Gutter spacing",
];

export const FINISHING = [
  "Perforation",
  "Back slit",
  "Over-lamination",
  "Butt cut",
  "Die cut",
  "Sheeting",
];

export const CORNER_RADII = ['Square (0)', '1/16"', '1/8"', '1/4"', "Custom"];
export const CORE_SIZES = ['1"', '1.5"', '3"', '6"'];

export const COLOR_METHODS: { id: ColorMethod; label: string; desc: string }[] = [
  { id: "process", label: "CMYK Process", desc: "Full-color / photographic" },
  { id: "spot", label: "Spot Colors Only", desc: "Pantone flat colors" },
  { id: "mixed", label: "CMYK + Spot", desc: "Process with Pantone" },
];

export const EMPTY_WIZARD_SPEC: QuoteSpec = {
  product: "",
  type: "Prime / pressure-sensitive",
  material: "",
  widthIn: 0,
  heightIn: 0,
  quantity: 0,
  colors: 4,
  variableData: false,
  repeatIn: 0,
  across: 1,
  colorMethod: "process",
  frontColors: 4,
  backColors: 0,
  whitePlate: false,
  varnish: false,
  artworkColors: [],
  qtyBreaks: [0],
  grouped: false,
  rush: false,
  premiumFinishes: [],
  features: [],
  finishing: [],
};

export function stepIsValid(step: number, spec: QuoteSpec): boolean {
  if (step === 0) return Boolean(spec.product);
  if (step === 1) return Boolean(spec.material);
  if (step === 2) return spec.widthIn > 0 && spec.heightIn > 0;
  if (step === 5) {
    const breaks = (spec.qtyBreaks ?? []).filter((n) => Number(n) > 0);
    return breaks.length > 0 || spec.quantity > 0;
  }
  return true;
}

export function canOpenStep(target: number, current: number, spec: QuoteSpec): boolean {
  if (target === 0) return true;
  if (target === 1) return Boolean(spec.product);
  if (target === 2) return Boolean(spec.material);
  if (target <= current) return true;
  return spec.widthIn > 0 && spec.heightIn > 0;
}

export function specFromProductName(name: string, base: QuoteSpec = EMPTY_WIZARD_SPEC): QuoteSpec {
  return { ...base, product: name };
}

export function specFromParsed(
  parsed: ParsedDocumentSpec,
  base: QuoteSpec = EMPTY_WIZARD_SPEC
): QuoteSpec {
  return {
    ...base,
    product: parsed.product ?? parsed.productType ?? base.product,
    type: parsed.type ?? base.type,
    widthIn: parsed.widthIn ?? base.widthIn,
    heightIn: parsed.heightIn ?? base.heightIn,
    quantity: parsed.quantity ?? base.quantity,
    colors: parsed.colors ?? base.colors,
    frontColors: parsed.frontColors ?? parsed.colors ?? base.frontColors,
    colorMethod: parsed.colorMethod ?? base.colorMethod,
    material: parsed.material ?? base.material,
    variableData: parsed.variableData ?? base.variableData,
    repeatIn: parsed.repeatIn ?? parsed.heightIn ?? base.repeatIn,
    across: parsed.across ?? base.across,
    qtyBreaks: parsed.qtyBreaks ?? (parsed.quantity ? [parsed.quantity] : base.qtyBreaks),
    rush: parsed.rush ?? base.rush,
    features: parsed.variableData
      ? [...new Set([...(base.features ?? []), "Variable data"])]
      : base.features,
  };
}
