import { Suspense } from "react";
import QuotePageClient from "./quote-page-client";
import { getAppSession } from "@/lib/auth/session";
import { loadCatalog, loadCompany } from "@/lib/pricing/catalog";
import {
  publicMaterialsByProduct,
  toPublicMaterials,
} from "@/lib/pricing/materials";

export default async function QuotePage() {
  const [catalog, session] = await Promise.all([
    loadCatalog(),
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
          materials={toPublicMaterials(catalog.materials)}
          materialNamesByProduct={publicMaterialsByProduct(catalog)}
          companies={locked ? [locked] : []}
          lockedCompany={locked}
          loggedIn={session.role === "customer"}
        />
    </Suspense>
  );
}
