"use client";

import { useSearchParams } from "next/navigation";
import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";
import type { Company, Material } from "@/types";

export default function QuotePageClient({
  materials,
  companies,
  lockedCompany,
  loggedIn,
}: {
  materials: Material[];
  companies: Company[];
  lockedCompany: Company | null;
  loggedIn: boolean;
}) {
  const searchParams = useSearchParams();
  const product = searchParams.get("product");

  return (
    <section className="pt-8 pb-20 px-5 md:px-8">
      <div className="max-w-screen-xl mx-auto">
        <div className="mb-8 max-w-2xl">
          <div className="text-teal font-semibold text-sm tracking-widest">
            ONLINE QUOTING
          </div>
          <h1 className="heading-font text-4xl md:text-5xl tracking-tighter font-semibold mt-1">
            Pick a customer, enter the specs, save the quote.
          </h1>
          <p className="text-slate-600 mt-3">
            Choose or add the company first. Then enter product attributes only —
            no reseller toggle and no discount field on the estimate.
          </p>
        </div>
        <EstimatorWorkspace
          enableCheckout
          initialProductSlug={product}
          materials={materials}
          companies={companies}
          lockedCompany={lockedCompany}
          loggedIn={loggedIn}
        />
      </div>
    </section>
  );
}
