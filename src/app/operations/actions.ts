"use server";

import { logout } from "@/app/auth/actions";
import { getAppSession } from "@/lib/auth/session";
import {
  approveQuote,
  createCompany,
  createJobFromQuote,
  rescheduleJob,
  saveQuote,
} from "@/lib/erp/store";
import { loadCatalog, loadCompany } from "@/lib/pricing/catalog";
import { calculateQuote } from "@/lib/pricing/engine";
import type { CompanyType, QuoteSpec } from "@/types";

async function requireEmployee() {
  const session = await getAppSession();
  if (session.role !== "employee") {
    throw new Error("Employees only");
  }
  return session;
}

export async function logoutOperations() {
  return logout("employee");
}

export async function addCompanyAction(input: {
  name: string;
  type: CompanyType;
  margin_percent: number;
  target_margin_percent: number;
  discount_percent: number;
}) {
  await requireEmployee();
  if (!input.name.trim()) throw new Error("Company name is required");
  return createCompany(input);
}

export async function saveQuoteAction(input: {
  companyId: string;
  spec: QuoteSpec;
}) {
  const session = await requireEmployee();
  const company = await loadCompany(input.companyId);
  if (!company) throw new Error("Select a customer first");
  const catalog = await loadCatalog();
  const breakdown = calculateQuote(input.spec, company, catalog);
  return saveQuote({
    companyId: company.id,
    spec: input.spec,
    breakdown,
    createdBy: session.userId,
  });
}

export async function approveQuoteAction(quoteId: string) {
  await requireEmployee();
  return approveQuote(quoteId);
}

export async function generateJobTicketAction(quoteId: string) {
  await requireEmployee();
  return createJobFromQuote(quoteId);
}

export async function rescheduleJobAction(jobId: string, startedAt: string) {
  await requireEmployee();
  return rescheduleJob(jobId, startedAt);
}
