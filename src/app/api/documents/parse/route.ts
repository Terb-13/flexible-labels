import { NextResponse } from "next/server";
import type { ParsedDocumentSpec } from "@/types";

/** Rule-based demo parser; swap for Claude/Grok vision when API keys are configured. */
function parseText(text: string): ParsedDocumentSpec {
  const lower = text.toLowerCase();
  const missingFields: string[] = [];

  const qtyMatch = text.match(/(\d[\d,]*)\s*(labels|stickers|rolls|qty|quantity)?/i);
  const quantity = qtyMatch ? Number(qtyMatch[1].replace(/,/g, "")) : undefined;
  if (!quantity) missingFields.push("quantity");

  const dimMatch = text.match(/(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)/i);
  const widthIn = dimMatch ? Number(dimMatch[1]) : undefined;
  const heightIn = dimMatch ? Number(dimMatch[2]) : undefined;
  if (!widthIn || !heightIn) missingFields.push("dimensions");

  let productType = "Roll Labels";
  if (lower.includes("bumper")) productType = "Bumper Stickers";
  else if (lower.includes("magnet")) productType = "Custom Magnets";
  else if (lower.includes("tape")) productType = "Printed Packaging Tape";
  else if (lower.includes("foil")) productType = "Foil Embossing";
  else if (lower.includes("parking") || lower.includes("decal"))
    productType = "Parking Decals";
  else if (lower.includes("die-cut") || lower.includes("sticker"))
    productType = "Custom Die-Cut Stickers";

  let material = "Matte BOPP";
  if (lower.includes("vinyl")) material = "UV Vinyl";
  else if (lower.includes("pet") || lower.includes("poly")) material = "Gloss PET";
  else if (lower.includes("foil")) material = "Foil Laminate";

  const colorsMatch = text.match(/(\d+)\s*color/i);
  const colors = colorsMatch ? Number(colorsMatch[1]) : undefined;
  if (!colors) missingFields.push("color count");

  const variableData =
    lower.includes("variable") ||
    lower.includes("serial") ||
    lower.includes("qr");

  return {
    productType,
    widthIn,
    heightIn,
    quantity,
    colors: colors ?? 4,
    material,
    variableData,
    notes: text.slice(0, 240),
    missingFields,
    confidence: missingFields.length === 0 ? 0.92 : 0.74,
  };
}

export async function POST(request: Request) {
  const form = await request.formData();
  const text = (form.get("text") as string | null)?.trim() ?? "";
  const file = form.get("file") as File | null;

  let combined = text;
  if (file) {
    if (file.type.startsWith("text/") || file.name.endsWith(".txt")) {
      combined += `\n${await file.text()}`;
    } else {
      combined += `\nUploaded file: ${file.name}. Demo extraction assumes roll label job specs from filename and type.`;
      if (file.name.toLowerCase().includes("bumper")) {
        combined += " bumper stickers outdoor UV vinyl";
      }
    }
  }

  if (!combined.trim()) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  // Production: call AI vision model with file buffer + prompt schema.
  const parsed = parseText(combined);

  return NextResponse.json(parsed);
}
