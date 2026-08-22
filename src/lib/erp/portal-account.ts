import {
  DEMO_COMPANY,
  DEMO_HISTORY,
  DEMO_INVOICES,
  DEMO_ORDERS,
  DEMO_PROOF,
} from "@/lib/data/demo-data";
import { forCompany } from "@/lib/data/tenant";
import { listQuotesForCompany } from "@/lib/erp/store";
import { loadCompanies } from "@/lib/pricing/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Company, Invoice, Order, Proof, SavedQuote } from "@/types";

export type PortalAccount = {
  company: Company | null;
  orders: Order[];
  history: Order[];
  invoices: Invoice[];
  proof: Proof | null;
  quotes: SavedQuote[];
};

function emptyAccount(): PortalAccount {
  return {
    company: null,
    orders: [],
    history: [],
    invoices: [],
    proof: null,
    quotes: [],
  };
}

function fixtureAccount(companyId: string, company: Company | null): PortalAccount {
  const open = forCompany(DEMO_ORDERS, companyId);
  const history = forCompany(DEMO_HISTORY, companyId);
  const invoices = forCompany(DEMO_INVOICES, companyId);
  const proof = DEMO_PROOF.company_id === companyId ? DEMO_PROOF : null;
  return { company, orders: open, history, invoices, proof, quotes: [] };
}

export async function loadPortalAccount(
  companyId: string | null
): Promise<PortalAccount> {
  if (!companyId) return emptyAccount();

  const companies = await loadCompanies();
  const company =
    companies.find((c) => c.id === companyId) ??
    (companyId === DEMO_COMPANY.id ? DEMO_COMPANY : null);

  const quotes = await listQuotesForCompany(companyId);
  const fixtures = fixtureAccount(companyId, company);

  if (!isSupabaseConfigured()) {
    return { ...fixtures, quotes };
  }

  try {
    const admin = createAdminClient();
    const client = admin ?? (await createClient());
    const [ordersRes, invoicesRes, proofsRes] = await Promise.all([
      client.from("orders").select("*").eq("company_id", companyId),
      client.from("invoices").select("*").eq("company_id", companyId),
      client.from("proofs").select("*").eq("company_id", companyId).limit(1),
    ]);

    const dbOrders = ((ordersRes.data ?? []) as Order[]).filter(
      (o) => o.company_id === companyId
    );
    const dbInvoices = ((invoicesRes.data ?? []) as Invoice[]).filter(
      (i) => i.company_id === companyId
    );
    const dbProofs = ((proofsRes.data ?? []) as Proof[]).filter(
      (p) => p.company_id === companyId
    );

    const useDb = dbOrders.length > 0 || dbInvoices.length > 0 || dbProofs.length > 0;
    if (!useDb) return { ...fixtures, quotes };

    const open = dbOrders.filter((o) => o.status !== "Completed");
    const history = dbOrders.filter((o) => o.status === "Completed");
    return {
      company,
      orders: open,
      history,
      invoices: dbInvoices,
      proof: dbProofs[0] ?? null,
      quotes,
    };
  } catch {
    return { ...fixtures, quotes };
  }
}
