import { NextResponse } from "next/server";
import { companyById } from "@/lib/data/demo-data";
import { calculateQuote, toCustomerQuote } from "@/lib/pricing/engine";
import type { QuoteSpec } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as QuoteSpec & {
    companyId?: string;
    discountPercent?: number;
    view?: "customer" | "internal";
  };

  try {
    const company = companyById(body.companyId);
    const breakdown = calculateQuote(body, company, {
      discountPercent: body.discountPercent,
    });

    if (body.view === "customer") {
      return NextResponse.json(toCustomerQuote(breakdown, body.quantity));
    }

    return NextResponse.json(breakdown);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to price quote";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
