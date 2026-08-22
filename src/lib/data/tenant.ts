import type { Company, Invoice, Order, Proof, SavedQuote } from "@/types";

export function forCompany<T extends { company_id: string | null }>(
  rows: T[],
  companyId: string | null | undefined
): T[] {
  if (!companyId) return [];
  return rows.filter((row) => row.company_id === companyId);
}

export function companyById(
  companies: Company[],
  companyId: string | null | undefined
): Company | null {
  if (!companyId) return null;
  return companies.find((c) => c.id === companyId) ?? null;
}

export function quoteNumberOf(quote: SavedQuote): string {
  return (
    quote.quote_number ||
    quote.spec.quoteNumber ||
    `Q-${quote.id.replace(/-/g, "").slice(0, 5).toUpperCase()}`
  );
}

export function invoiceForCompany(invoices: Invoice[], companyId: string | null) {
  return forCompany(invoices, companyId);
}

export function ordersForCompany(orders: Order[], companyId: string | null) {
  return forCompany(orders, companyId);
}

export function proofsForCompany(proofs: Proof[], companyId: string | null) {
  return forCompany(proofs, companyId);
}
