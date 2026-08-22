import { NextResponse } from "next/server";
import { defaultDtcCompany, loadCatalog, loadCompany } from "@/lib/pricing/catalog";
import { calculateQuoteBreaks, normalizeSpec } from "@/lib/pricing/engine";
import type { QuoteSpec } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as QuoteSpec & { companyId?: string };
  const spec = normalizeSpec(body);
  const catalog = await loadCatalog();
  const company = body.companyId
    ? ((await loadCompany(body.companyId)) ?? (await defaultDtcCompany()))
    : await defaultDtcCompany();

  const estimate = calculateQuoteBreaks(spec, company, catalog);
  return NextResponse.json({
    spec,
    company: {
      id: company.id,
      name: company.name,
      is_reseller: company.is_reseller,
      margin_percent: company.margin_percent,
      target_margin_percent: company.target_margin_percent,
      discount_percent: company.discount_percent,
    },
    breakdown: estimate.primary,
    breaks: estimate.breaks,
    grouped: estimate.grouped,
    quantities: estimate.quantities,
    pricedQuantity: estimate.pricedQuantity,
    viable: estimate.viable,
  });
}
