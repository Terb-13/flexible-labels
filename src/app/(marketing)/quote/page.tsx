import { Suspense } from "react";
import QuotePageClient from "./quote-page-client";
import { getAppSession } from "@/lib/auth/session";
import { listCompanies } from "@/lib/erp/store";
import { loadCatalog, loadCompany } from "@/lib/pricing/catalog";

export default async function QuotePage() {
  const [catalog, companies, session] = await Promise.all([
    loadCatalog(),
    listCompanies(),
    getAppSession(),
  ]);
  const locked =
    session.role === "customer" && session.profile?.company_id
      ? ((await loadCompany(session.profile.company_id)) ?? null)
      : null;

  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">Loading quote builder…</div>
      }
    >
      <QuotePageClient
        materials={catalog.materials}
        companies={locked ? [locked] : companies}
        lockedCompany={locked}
        loggedIn={session.role === "customer"}
      />
    </Suspense>
  );
}
