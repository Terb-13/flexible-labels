"use client";

import { useSearchParams } from "next/navigation";
import { EstimatorWorkspace } from "@/components/portal/estimator-workspace";
import type { Company, Equipment, Material } from "@/types";

export default function QuotePageClient({
  materials,
  equipment,
  companies,
  lockedCompany,
  loggedIn,
}: {
  materials: Material[];
  equipment: Equipment[];
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
            {lockedCompany
              ? "Tell us what you need. We’ll price it."
              : "Pick a customer, then walk the estimate."}
          </h1>
          <p className="text-slate-600 mt-3">
            {lockedCompany
              ? "Seven steps — product through estimate. Type and discount come from your account, not this form."
              : "Customer first. Then product, material, size, colors, specs, and quantity breaks. No reseller toggle and no discount field on the estimate."}
          </p>
        </div>
        <EstimatorWorkspace
          enableCheckout
          initialProductSlug={product}
          materials={materials}
          equipment={equipment}
          companies={companies}
          lockedCompany={lockedCompany}
          loggedIn={loggedIn}
        />
      </div>
    </section>
  );
}
