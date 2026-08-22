"use server";

import { getAppSession } from "@/lib/auth/session";
import { createCompany, saveQuote } from "@/lib/erp/store";
import { defaultDtcCompany, loadCatalog, loadCompany } from "@/lib/pricing/catalog";
import {
  calculateQuote,
  calculateQuoteBreaks,
  withAutoAcross,
} from "@/lib/pricing/engine";
import type { CompanyType, QuoteSpec } from "@/types";

export async function addPublicCompanyAction(input: {
  name: string;
  type: CompanyType;
  margin_percent: number;
  target_margin_percent: number;
  discount_percent: number;
}) {
  if (!input.name.trim()) throw new Error("Company name is required");
  return createCompany(input);
}

export async function savePublicQuoteAction(input: {
  companyId?: string;
  spec: QuoteSpec;
}) {
  const company = input.companyId
    ? ((await loadCompany(input.companyId)) ?? (await defaultDtcCompany()))
    : await defaultDtcCompany();
  const catalog = await loadCatalog();
  const estimate = calculateQuoteBreaks(input.spec, company, catalog);
  const breakdown = estimate.primary ?? calculateQuote(input.spec, company, catalog);
  const spec = {
    ...input.spec,
    ...withAutoAcross(input.spec, company, catalog),
    quantity: estimate.pricedQuantity || input.spec.quantity,
    qtyBreaks: estimate.quantities,
    grouped: estimate.grouped,
    breakSnapshots: estimate.breaks.map((b) => ({
      quantity: b.quantity,
      finalPrice: b.breakdown.finalPrice,
      perUnit: b.breakdown.finalPrice / Math.max(b.quantity, 1),
      totalCost: b.breakdown.totalCost,
      routeName: b.breakdown.routeName,
      viable: b.viable,
    })),
  };
  const session = await getAppSession();
  return saveQuote({
    companyId: company.id,
    spec,
    breakdown,
    createdBy: session.userId,
  });
}
