import { NextResponse } from "next/server";
import { DEMO_COMPANY, DEMO_RESELLER } from "@/lib/data/demo-data";
import { calculateQuote } from "@/lib/pricing/engine";
import type { QuoteSpec } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as QuoteSpec & {
    companyId?: string;
    discountPercent?: number;
  };

  const company =
    body.companyId === DEMO_RESELLER.id ? DEMO_RESELLER : DEMO_COMPANY;

  let breakdown = calculateQuote(body, company);

  if (body.discountPercent && body.discountPercent > 0) {
    const discountedPrice =
      Math.round(breakdown.finalPrice * (1 - body.discountPercent / 100) * 100) /
      100;
    const marginAmount = discountedPrice - breakdown.totalCost;
    const marginPercent =
      discountedPrice > 0
        ? Math.round((marginAmount / discountedPrice) * 1000) / 10
        : 0;
    breakdown = {
      ...breakdown,
      finalPrice: discountedPrice,
      marginAmount,
      marginPercent,
      needsApproval: marginPercent < company.target_margin_percent,
    };
  }

  return NextResponse.json(breakdown);
}
