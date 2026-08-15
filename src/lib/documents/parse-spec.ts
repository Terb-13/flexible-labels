import { FINISHES, SUBSTRATES, findMaterial } from "@/lib/data/material-master";
import type { ParsedDocumentSpec } from "@/types";

const PRODUCT_RULES: { test: RegExp; name: string }[] = [
  { test: /bumper/i, name: "Bumper Stickers" },
  { test: /magnet/i, name: "Custom Magnets" },
  { test: /packaging\s*tape|\btape\b/i, name: "Printed Packaging Tape" },
  { test: /foil|emboss/i, name: "Foil Embossing & Specialty" },
  { test: /parking|decal|permit/i, name: "Parking Decals & Permits" },
  { test: /die[- ]?cut|sticker/i, name: "Custom Die-Cut Stickers" },
  { test: /variable\s*data|serializ|qr\s*code/i, name: "Variable Data / QR / Serialized" },
  { test: /roll\s*label|prime\s*label|ps\s*label|pressure[- ]sensitive/i, name: "Roll Labels" },
];

const CRITICAL_FIELDS = ["quantity", "dimensions", "material"] as const;

function parseQty(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function extractQuantity(text: string): number | undefined {
  const labeled = text.match(
    /(?:qty|quantity|piece\s*count)\s*[:=]?\s*(\d[\d,]*)/i
  );
  const fromLabel = parseQty(labeled?.[1]);
  if (fromLabel && fromLabel >= 10) return fromLabel;

  const afterNoun = text.match(
    /(?:labels?|stickers?|rolls?|qty|quantity)\s+(\d{1,3}(?:,\d{3})+|\d{3,})\b/i
  );
  const fromAfterNoun = parseQty(afterNoun?.[1]);
  if (fromAfterNoun) return fromAfterNoun;

  const leading = text.match(
    /(\d{1,3}(?:,\d{3})+|\d{3,})\s+(?:[\w."/-]+\s+){0,6}(?:labels?|stickers?|pcs|pieces|rolls?)\b/i
  );
  const fromLeading = parseQty(leading?.[1]);
  if (fromLeading) return fromLeading;

  const trailing = text.match(
    /(\d{1,3}(?:,\d{3})+|\d{3,})\s*(?:labels?|stickers?|pcs|pieces|qty|quantity|rolls?)\b/i
  );
  return parseQty(trailing?.[1]) ?? (fromLabel && fromLabel >= 50 ? fromLabel : undefined);
}

function extractDimensions(text: string): { widthIn?: number; heightIn?: number } {
  const labeled = text.match(
    /(?:size|dimensions?|width)\s*[:=]?\s*(\d+\.?\d*)\s*(?:in(?:ch(?:es)?)?|")?\s*[x×by]\s*(\d+\.?\d*)/i
  );
  const plain = text.match(/(\d+\.?\d*)\s*(?:in(?:ch(?:es)?)?|")?\s*[x×]\s*(\d+\.?\d*)\s*(?:in(?:ch(?:es)?)?|")?/i);
  const match = labeled ?? plain;
  if (!match) return {};
  const widthIn = Number(match[1]);
  const heightIn = Number(match[2]);
  if (!Number.isFinite(widthIn) || !Number.isFinite(heightIn) || widthIn <= 0 || heightIn <= 0) {
    return {};
  }
  return { widthIn, heightIn };
}

function extractColors(text: string): number | undefined {
  if (/4[- ]color\s*process|process\s*cmyk|\bcmyk\b/i.test(text)) return 4;
  const match = text.match(/(\d+)\s*(?:-)?\s*colors?\b/i);
  if (!match) return undefined;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 && n <= 12 ? n : undefined;
}

function extractProductType(text: string): string | undefined {
  for (const rule of PRODUCT_RULES) {
    if (rule.test.test(text)) return rule.name;
  }
  return undefined;
}

function extractMaterial(text: string): string | undefined {
  const labeled = text.match(/(?:material|substrate|stock|facestock)\s*[:=]\s*([A-Za-z0-9 ./"-]+)/i);
  if (labeled) {
    const hit = findMaterial(labeled[1], SUBSTRATES);
    if (hit) return hit.name;
  }

  const lower = text.toLowerCase();
  const ranked = SUBSTRATES
    .map((m) => {
      const terms = [m.name, ...m.aliases].map((t) => t.toLowerCase());
      const matched = terms.find((t) => t.length >= 3 && lower.includes(t));
      return matched ? { name: m.name, len: matched.length } : null;
    })
    .filter((x): x is { name: string; len: number } => Boolean(x))
    .sort((a, b) => b.len - a.len);

  return ranked[0]?.name;
}

function extractFinish(text: string): string | undefined {
  const lower = text.toLowerCase();
  const ranked = FINISHES
    .map((m) => {
      const terms = [m.name, ...m.aliases].map((t) => t.toLowerCase());
      const matched = terms.find((t) => t.length >= 3 && lower.includes(t));
      return matched ? { name: m.name, len: matched.length } : null;
    })
    .filter((x): x is { name: string; len: number } => Boolean(x))
    .sort((a, b) => b.len - a.len);
  return ranked[0]?.name;
}

function extractVariableData(text: string): boolean | undefined {
  if (/\bno\s+(variable|serial|vdp|qr)\b/i.test(text)) return false;
  if (/\b(variable\s*data|serializ|sequential|qr\s*code|barcode|vdp)\b/i.test(text)) {
    return true;
  }
  return undefined;
}

/**
 * Rule-based extractor. Critical fields (quantity, dimensions, material)
 * are only filled when present in the text — never invented.
 */
export function parseSpecFromText(
  text: string,
  source: ParsedDocumentSpec["source"] = "text"
): ParsedDocumentSpec {
  const cleaned = text.replace(/\u0000/g, " ").replace(/[ \t]+/g, " ").trim();
  const missingFields: string[] = [];

  const quantity = extractQuantity(cleaned);
  const { widthIn, heightIn } = extractDimensions(cleaned);
  const material = extractMaterial(cleaned);
  const productType = extractProductType(cleaned);
  const colors = extractColors(cleaned);
  const finish = extractFinish(cleaned);
  const variableData = extractVariableData(cleaned);

  if (!quantity) missingFields.push("quantity");
  if (!widthIn || !heightIn) missingFields.push("dimensions");
  if (!material) missingFields.push("material");
  if (!productType) missingFields.push("product type");
  if (!colors) missingFields.push("color count");

  const criticalMissing = CRITICAL_FIELDS.filter((f) => missingFields.includes(f));
  const confidence =
    cleaned.length < 8
      ? 0
      : round2(
          1 -
            criticalMissing.length * 0.28 -
            (missingFields.length - criticalMissing.length) * 0.08
        );

  return {
    productType,
    widthIn,
    heightIn,
    quantity,
    colors,
    material,
    finish,
    variableData,
    notes: cleaned.slice(0, 280) || undefined,
    missingFields,
    confidence: Math.max(0, Math.min(1, confidence)),
    source,
  };
}

export function extractPrintableText(buffer: ArrayBuffer, filename: string): string {
  const bytes = new Uint8Array(buffer);
  const asLatin = new TextDecoder("latin1").decode(bytes);
  const strings: string[] = [];

  for (const match of asLatin.matchAll(/[A-Za-z0-9][A-Za-z0-9 .,"'/:x×$%#+\-]{3,}/g)) {
    strings.push(match[0]);
  }

  const xmlText = [...asLatin.matchAll(/>([^<]{2,})</g)].map((m) => m[1]);
  strings.push(...xmlText);

  const pdfLiterals = [...asLatin.matchAll(/\(([^)]{2,})\)/g)].map((m) => m[1]);
  strings.push(...pdfLiterals);

  const joined = `${filename}\n${strings.join(" ")}`
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');

  return joined;
}

export function sourceFromFilename(name: string, mime = ""): ParsedDocumentSpec["source"] {
  const lower = `${name} ${mime}`.toLowerCase();
  if (lower.includes("pdf")) return "pdf";
  if (/\.(xlsx|xls|csv)|spreadsheet|excel/.test(lower)) return "excel";
  if (/\.(png|jpe?g|webp|gif)|image\//.test(lower)) return "image";
  if (/\.(txt|csv)|text\//.test(lower)) return "text";
  return "unknown";
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
