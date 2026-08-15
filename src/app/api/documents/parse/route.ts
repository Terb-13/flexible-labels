import { NextResponse } from "next/server";
import {
  extractPrintableText,
  parseSpecFromText,
  sourceFromFilename,
} from "@/lib/documents/parse-spec";
import type { ParsedDocumentSpec } from "@/types";

export async function POST(request: Request) {
  const form = await request.formData();
  const text = (form.get("text") as string | null)?.trim() ?? "";
  const file = form.get("file") as File | null;

  let combined = text;
  let source: ParsedDocumentSpec["source"] = text ? "text" : "unknown";

  if (file) {
    source = sourceFromFilename(file.name, file.type);
    const buffer = await file.arrayBuffer();

    if (
      file.type.startsWith("text/") ||
      /\.(txt|csv|tsv)$/i.test(file.name)
    ) {
      combined += `\n${await file.text()}`;
      source = "text";
    } else if (source === "image") {
      const fromName = parseSpecFromText(file.name, "image");
      const parsed = parseSpecFromText(`${text}\n${file.name}`, "image");
      const missing = new Set([
        ...parsed.missingFields,
        ...(fromName.missingFields.includes("quantity") ? [] : []),
      ]);
      if (!text.trim()) {
        ["quantity", "dimensions", "material", "product type", "color count"].forEach(
          (f) => missing.add(f)
        );
      }
      return NextResponse.json({
        ...parsed,
        missingFields: [...missing],
        notes:
          "Image uploaded. Critical values are only filled from readable text — nothing was invented from the screenshot.",
        confidence: text.trim() ? parsed.confidence : 0.15,
        source: "image",
      } satisfies ParsedDocumentSpec);
    } else {
      combined += `\n${extractPrintableText(buffer, file.name)}`;
    }
  }

  if (!combined.trim()) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  const parsed = parseSpecFromText(combined, source);
  return NextResponse.json(parsed);
}
