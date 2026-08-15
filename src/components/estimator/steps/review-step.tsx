"use client";

import { formatCurrency } from "@/lib/pricing/engine";
import type { Company, QuoteBreakdown, QuoteSpec } from "@/types";
import { Button } from "@/components/ui/button";

export function ReviewStep({
  internal,
  company,
  spec,
  breakdown,
  priceError,
  quoteSaved,
  enableCheckout,
  onSave,
  onCheckout,
}: {
  internal: boolean;
  company: Company;
  spec: QuoteSpec;
  breakdown: QuoteBreakdown | null;
  priceError: string | null;
  quoteSaved: boolean;
  enableCheckout: boolean;
  onSave: () => void;
  onCheckout: () => void;
}) {
  if (priceError || !breakdown) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-800">
        {priceError ?? "Enter valid specs to price."} Go back and correct the job.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-navy">
          {internal ? "Review & price" : "Your price"}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {spec.productType} · {spec.widthIn}&quot; × {spec.heightIn}&quot; ·{" "}
          {spec.quantity.toLocaleString()} · {spec.material}
          {spec.variableData ? " · Variable data" : ""}
        </p>
      </div>

      <div className="text-4xl font-semibold text-navy">
        {formatCurrency(breakdown.finalPrice)}
      </div>
      <p className="text-sm text-slate-600 -mt-3">
        {formatCurrency(breakdown.finalPrice / Math.max(spec.quantity, 1), true)} per
        unit · 5–7 business days from approved proof
      </p>

      {internal ? (
        <>
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-sm">
            <div className="text-xs font-semibold tracking-wider text-slate-500">
              COST BREAKDOWN · {company.name}
              {company.is_reseller ? " · Reseller" : " · Direct"}
            </div>
            {breakdown.buckets.map((bucket) => (
              <div key={bucket.key} className="flex justify-between text-slate-600">
                <span>{bucket.label}</span>
                <span>{formatCurrency(bucket.amount)}</span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total cost</span>
              <span>{formatCurrency(breakdown.totalCost)}</span>
            </div>
            <div className="flex justify-between text-teal">
              <span>
                Margin ({breakdown.marginPercent}%) · target {breakdown.targetMarginPercent}%
              </span>
              <span>{formatCurrency(breakdown.marginAmount)}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">Recommended asset</div>
            <div>
              {breakdown.recommendedAssetName} · {breakdown.across}-up ·{" "}
              {Math.round(breakdown.runMinutes)} min
            </div>
            <div>
              {breakdown.materialSku} · {breakdown.materialName}
            </div>
            <div>Route: {breakdown.routeSteps.join(" → ")}</div>
          </div>

          {breakdown.needsApproval ? (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              Below target margin ({breakdown.targetMarginPercent}%). Saving this
              estimate sends it to the approval queue.
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              Margin at or above target. Save to continue to Job Ticket.
            </div>
          )}

          <Button className="w-full" variant="teal" onClick={onSave}>
            Save estimate
          </Button>
          {quoteSaved && (
            <p className="text-sm text-emerald-700">
              Estimate saved. Continue to Approval & Ticket.
            </p>
          )}
        </>
      ) : (
        <>
          {quoteSaved && (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
              Quote submitted. Your account team will confirm and send a formal PO.
            </div>
          )}
          <div className="space-y-2">
            {enableCheckout && (
              <Button className="w-full" variant="cta" onClick={onCheckout}>
                Place Order — Pay Now
              </Button>
            )}
            <Button
              className="w-full"
              variant={enableCheckout ? "outline" : "cta"}
              onClick={onSave}
            >
              Request formal quote
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
