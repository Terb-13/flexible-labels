import { PRODUCT_OPTIONS } from "@/lib/data/example-catalog";
import { EXAMPLE_MATERIALS } from "@/lib/data/example-catalog";
import type { ParsedDocumentSpec, RfpIntakeItem } from "@/types";

const PRODUCT_ALIASES: [RegExp, string][] = [
  [/bumper/i, "Bumper Stickers"],
  [/magnet/i, "Custom Magnets"],
  [/tape/i, "Printed Packaging Tape"],
  [/foil|emboss/i, "Foil Embossing & Specialty"],
  [/parking|permit|decal/i, "Parking Decals & Permits"],
  [/variable|serial|qr/i, "Variable Data / QR / Serialized"],
  [/die[- ]?cut|sticker/i, "Custom Die-Cut Stickers"],
  [/roll\s*label|pressure[- ]sensitive|prime label/i, "Roll Labels"],
];

function matchProduct(text: string): string | undefined {
  for (const [re, name] of PRODUCT_ALIASES) {
    if (re.test(text) && PRODUCT_OPTIONS.includes(name)) return name;
  }
  return undefined;
}

function matchMaterial(text: string): string | undefined {
  const lower = text.toLowerCase();
  const names = EXAMPLE_MATERIALS.filter((m) => m.kind === "substrate").map(
    (m) => m.name
  );
  for (const name of names) {
    if (lower.includes(name.toLowerCase())) return name;
  }
  if (lower.includes("vinyl")) return "UV Vinyl";
  if (lower.includes("pet") || lower.includes("poly")) return "Gloss PET";
  if (lower.includes("foil")) return "Foil Laminate";
  if (lower.includes("gloss") && lower.includes("bopp")) return "Gloss BOPP";
  if (lower.includes("bopp") || lower.includes("matte")) return "Matte BOPP";
  return undefined;
}

function extractQtys(text: string): number[] {
  const nums = [...text.matchAll(/(\d[\d,]{2,})\s*(?:labels|units|pcs|ea\b|qty|quantity)?/gi)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n >= 100);
  return [...new Set(nums)].slice(0, 7);
}

/** Rule-based RFP / spec parser. No LLM vendor, no API keys. */
export function parseSpecText(text: string): ParsedDocumentSpec {
  const lower = text.toLowerCase();
  const missingFields: string[] = [];

  const qtyBreaks = extractQtys(text);
  const quantity = qtyBreaks[0];
  if (!quantity) missingFields.push("quantity");

  const dimMatch = text.match(/(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)/i);
  const widthIn = dimMatch ? Number(dimMatch[1]) : undefined;
  const heightIn = dimMatch ? Number(dimMatch[2]) : undefined;
  if (!widthIn || !heightIn) missingFields.push("dimensions");

  const product = matchProduct(text) ?? "Roll Labels";
  const material = matchMaterial(text);
  if (!material) missingFields.push("material");

  const colorsMatch = text.match(/(\d+)\s*colou?rs?/i);
  const frontColors = colorsMatch ? Number(colorsMatch[1]) : undefined;
  if (!frontColors) missingFields.push("color count");

  const hasSpot = /spot|pantone|pms/i.test(text);
  const hasProc = /process|cmyk/i.test(text);
  const colorMethod = hasSpot && hasProc ? "mixed" : hasSpot ? "spot" : hasProc ? "process" : undefined;

  const variableData =
    lower.includes("variable") ||
    lower.includes("serial") ||
    lower.includes("qr") ||
    lower.includes("barcode");

  const acrossMatch = text.match(/(\d+)\s*(across|up)/i);
  const across = acrossMatch ? Number(acrossMatch[1]) : undefined;
  const repeatMatch = text.match(/repeat(?:\s*(?:of|at|:))?\s*(\d+\.?\d*)/i);
  const repeatIn = repeatMatch ? Number(repeatMatch[1]) : heightIn;

  const rush = /rush|expedite|2[-–]3 day/i.test(text);

  return {
    product,
    productType: product,
    type: "Prime / pressure-sensitive",
    widthIn,
    heightIn,
    quantity,
    colors: frontColors ?? 4,
    frontColors,
    colorMethod,
    material,
    variableData,
    repeatIn,
    across,
    qtyBreaks: qtyBreaks.length ? qtyBreaks : undefined,
    rush,
    notes: text.slice(0, 240),
    missingFields,
    confidence: missingFields.length === 0 ? 0.92 : 0.74,
  };
}

export function parseRfpDocument(text: string): RfpIntakeItem[] {
  const firstItem = text.search(/ITEM\s+\d+/i);
  const pre = firstItem > 0 ? text.slice(0, firstItem) : "";
  const body = firstItem > 0 ? text.slice(firstItem) : text;
  const custLine = pre
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .find((s) => !/request for quote/i.test(s));
  const customer = custLine ? custLine.split(/[—-]/)[0].trim() : null;
  const parts = body.split(/(?=ITEM\s+\d+)/i).filter((p) => /ITEM\s+\d+/i.test(p));
  const blocks = parts.length ? parts : [body];

  return blocks.map((block, index) => {
    const tm = block.match(/ITEM\s+\d+\s*[—\-:]?\s*([^\n]+)/i);
    const title = tm?.[1]?.trim() || `Item ${index + 1}`;
    const parsed = parseSpecText(block);
    const missing: string[] = [];
    if (!parsed.product) missing.push("Product");
    if (!parsed.material) missing.push("Material");
    if (!(parsed.widthIn && parsed.heightIn)) missing.push("Size");
    if (!parsed.quantity) missing.push("Quantity");
    const found: [string, string][] = [
      ["Product", parsed.product],
      ["Material", parsed.material],
      [
        "Size",
        parsed.widthIn && parsed.heightIn
          ? `${parsed.widthIn}" × ${parsed.heightIn}"`
          : undefined,
      ],
      ["Colors", parsed.frontColors ? String(parsed.frontColors) : undefined],
      ["Quantity", parsed.quantity ? parsed.quantity.toLocaleString() : undefined],
    ].filter((row): row is [string, string] => Boolean(row[1]));
    return {
      title,
      customer,
      parsed,
      missing,
      found,
      ready: missing.length === 0,
    };
  });
}
