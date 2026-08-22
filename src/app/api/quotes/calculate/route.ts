import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/auth/session";
import { defaultDtcCompany, loadCatalog, loadCompany } from "@/lib/pricing/catalog";
import {
  calculateLayouts,
  calculateQuoteBreaks,
  withAutoAcross,
} from "@/lib/pricing/engine";
import { toPublicCalculateResponse } from "@/lib/pricing/sell-price";
import type { QuoteSpec } from "@/types";

export async function POST(request: Request) {
  const body = (await request.json()) as QuoteSpec & { companyId?: string };
  const catalog = await loadCatalog();
  const company = body.companyId
    ? ((await loadCompany(body.companyId)) ?? (await defaultDtcCompany()))
    : await defaultDtcCompany();
  const spec = withAutoAcross(body, company, catalog);

  const estimate = calculateQuoteBreaks(spec, company, catalog);
  const session = await getAppSession();
  if (session.role !== "employee") {
    return NextResponse.json(toPublicCalculateResponse(estimate));
  }

  const layouts = calculateLayouts(spec, company, catalog);
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
    layouts: layouts.map((l) => ({
      across: l.across,
      webIn: l.webIn,
      viable: l.viable,
      finalPrice: l.breakdown.finalPrice,
      perUnit: l.breakdown.finalPrice / Math.max(spec.quantity, 1),
      routeName: l.breakdown.routeName,
    })),
  });
}
