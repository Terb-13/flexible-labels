"use server";

import { logout } from "@/app/auth/actions";
import { getAppSession } from "@/lib/auth/session";
import {
  approveQuote,
  clockIn,
  clockOut,
  createCompany,
  createJobFromQuote,
  rescheduleJob,
  saveQuote,
} from "@/lib/erp/store";
import { loadCatalog, loadCompany } from "@/lib/pricing/catalog";
import { calculateQuote, calculateQuoteBreaks } from "@/lib/pricing/engine";
import type { ClockActivity, CompanyType, QuoteSpec } from "@/types";

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
  const estimate = calculateQuoteBreaks(input.spec, company, catalog);
  const breakdown = estimate.primary ?? calculateQuote(input.spec, company, catalog);
  const spec = {
    ...input.spec,
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
  return saveQuote({
    companyId: company.id,
    spec,
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

export async function clockInAction(input: {
  jobStepId: string;
  equipmentId: string;
  activity: ClockActivity;
  delayReasonId?: string | null;
  notes?: string | null;
}) {
  const session = await requireEmployee();
  return clockIn({
    ...input,
    operatorId: session.userId,
    delayReasonId: input.delayReasonId ?? null,
    notes: input.notes ?? null,
  });
}

export async function clockOutAction(input: {
  clockId: string;
  qtyGood?: number | null;
  qtyWaste?: number | null;
  notes?: string | null;
}) {
  await requireEmployee();
  return clockOut(input);
}
