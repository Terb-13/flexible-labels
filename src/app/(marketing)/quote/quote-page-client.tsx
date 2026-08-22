"use client";

import { useSearchParams } from "next/navigation";
import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";
import type { Material } from "@/types";

export default function QuotePageClient({ materials }: { materials: Material[] }) {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");

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
            Enter product attributes for an immediate quote. Pricing is cost-plus
            from the plant catalog — not a reseller toggle on this page.
          </p>
        </div>
        <EstimatorWorkspace
          enableCheckout
          initialProductSlug={product}
          materials={materials}
        />
      </div>
    </section>
  );
}
