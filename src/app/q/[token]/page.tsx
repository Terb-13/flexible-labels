import { notFound } from "next/navigation";
import { CustomerQuoteClient } from "@/components/estimating/customer-quote-client";
import { getEstimateByShareToken } from "@/lib/estimating/estimates-store";
import { filterEstimateForRole } from "@/lib/estimating/role-filter";

export const dynamic = "force-dynamic";

export default async function SharedQuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const estimate = await getEstimateByShareToken(token);
  if (!estimate) notFound();

  const view = filterEstimateForRole(estimate.payload, "customer");

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
            Flexible Label Group
          </div>
          <h1 className="heading-font text-3xl font-semibold tracking-tight mt-1">
            Your quote
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Review pricing and respond. Cost details are not shown.
          </p>
        </div>
        <CustomerQuoteClient
          token={token}
          productLabel={estimate.productLabel}
          customerName={estimate.customerName}
          quantity={estimate.quantity}
          sellPrice={view.sellPrice}
          sellPricePerM={view.sellPricePerM}
          routeSummary={view.routeSummary}
          initialResponse={estimate.customerResponse}
          initialNote={estimate.customerResponseNote}
        />
      </div>
    </main>
  );
}
