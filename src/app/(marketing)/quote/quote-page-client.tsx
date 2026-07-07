"use client";

import { useSearchParams } from "next/navigation";
import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";

export default function QuotePageClient() {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");
  const tier = searchParams.get("tier") === "reseller" ? "reseller" : "business";

  return (
    <section className="pt-8 pb-20 px-5 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-8 max-w-2xl">
          <div className="text-teal font-semibold text-sm tracking-widest">
            INSTANT ONLINE QUOTING
          </div>
          <h1 className="heading-font text-4xl md:text-5xl tracking-tighter font-semibold mt-1">
            Get your price in seconds. Order online.
          </h1>
          <p className="text-slate-600 mt-3">
            Enter your specs below for an immediate quote — no waiting for email.
            Business and reseller pricing are calculated automatically. Prefer AI
            guidance? That&apos;s optional, not required.
          </p>
        </div>
        <EstimatorWorkspace
          enableCheckout
          initialProductSlug={product}
          defaultTier={tier}
        />
      </div>
    </section>
  );
}
