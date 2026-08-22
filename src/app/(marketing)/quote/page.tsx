import { Suspense } from "react";
import QuotePageClient from "./quote-page-client";
import { loadCatalog } from "@/lib/pricing/catalog";

export default async function QuotePage() {
  const catalog = await loadCatalog();

  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">Loading quote builder…</div>
      }
    >
      <QuotePageClient materials={catalog.materials} />
    </Suspense>
  );
}
