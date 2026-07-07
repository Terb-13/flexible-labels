import { NextResponse } from "next/server";
import { getBotResponse } from "@/lib/data/demo-data";

export async function POST(request: Request) {
  const { message } = (await request.json()) as { message?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Production: stream from AI SDK with Grok/Claude + production knowledge base.
  const reply = getBotResponse(message);

  return NextResponse.json({ reply });
}
