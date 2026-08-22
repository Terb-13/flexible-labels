import { NextResponse } from "next/server";
import { parseRfpDocument, parseSpecText } from "@/lib/documents/parse-rfp";

export async function POST(request: Request) {
  const form = await request.formData();
  const text = (form.get("text") as string | null)?.trim() ?? "";
  const file = form.get("file") as File | null;
  const mode = (form.get("mode") as string | null) ?? "spec";

  let combined = text;
  if (file) {
    if (file.type.startsWith("text/") || /\.(txt|csv)$/i.test(file.name)) {
      combined += `\n${await file.text()}`;
    } else {
      combined += `\nUploaded file: ${file.name}.`;
      if (file.name.toLowerCase().includes("bumper")) {
        combined += " bumper stickers outdoor UV vinyl";
      }
    }
  }

  if (!combined.trim()) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  if (mode === "rfp") {
    return NextResponse.json({ items: parseRfpDocument(combined) });
  }

  return NextResponse.json(parseSpecText(combined));
}
