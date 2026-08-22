"use server";

import { getAppSession } from "@/lib/auth/session";
import { createCompany, saveQuote } from "@/lib/erp/store";
import { loadCatalog, loadCompany } from "@/lib/pricing/catalog";
import { calculateQuote } from "@/lib/pricing/engine";
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
  companyId: string;
  spec: QuoteSpec;
}) {
  const company = await loadCompany(input.companyId);
  if (!company) throw new Error("Select a customer first");
  const catalog = await loadCatalog();
  const breakdown = calculateQuote(input.spec, company, catalog);
  const session = await getAppSession();
  return saveQuote({
    companyId: company.id,
    spec: input.spec,
    breakdown,
    createdBy: session.userId,
  });
}
