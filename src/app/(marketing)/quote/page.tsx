import { Suspense } from "react";
import QuotePageClient from "./quote-page-client";

export default function QuotePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-sm text-slate-500">Loading quote builder…</div>
      }
    >
      <QuotePageClient />
    </Suspense>
  );
}
