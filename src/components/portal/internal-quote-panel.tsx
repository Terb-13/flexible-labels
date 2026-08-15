"use client";

import { formatCurrency } from "@/lib/pricing/engine";
import type { QuoteBreakdown, QuoteSpec } from "@/types";
import { Button } from "@/components/ui/button";

export function InternalQuotePanel({
  breakdown,
  spec,
  companyName,
  isReseller,
  onSaveEstimate,
  onGenerateTicket,
  canGenerateTicket,
  ticketBlockedReason,
}: {
  breakdown: QuoteBreakdown;
  spec: QuoteSpec;
  companyName: string;
  isReseller: boolean;
  onSaveEstimate: () => void;
  onGenerateTicket: () => void;
  canGenerateTicket: boolean;
  ticketBlockedReason?: string;
}) {
  return (
    <div className="border border-slate-200 rounded-3xl p-6 bg-white h-fit lg:sticky lg:top-24">
      <div className="text-xs font-semibold text-slate-500 tracking-wider">
        FULL ESTIMATE · INTERNAL
      </div>
      <div className="text-3xl font-semibold text-navy mt-2">
        {formatCurrency(breakdown.finalPrice)}
      </div>
      <p className="text-xs text-slate-500 mt-1">
        {companyName}
        {isReseller ? " · Reseller" : " · Direct"} · {spec.quantity.toLocaleString()} pcs
      </p>

      <div className="mt-4 space-y-2 text-sm">
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

      <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-800">Recommended asset</div>
        <div>
          {breakdown.recommendedAssetName} · {breakdown.across}-up ·{" "}
          {Math.round(breakdown.runMinutes)} min
        </div>
        <div>{breakdown.materialSku} · {breakdown.materialName}</div>
        <div>Route: {breakdown.routeSteps.join(" → ")}</div>
      </div>

      {breakdown.needsApproval ? (
        <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          Below target margin ({breakdown.targetMarginPercent}%). Job Ticket is blocked
          until an approver logs a decision.
        </div>
      ) : (
        <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
          Margin at or above target. Ready for Job Ticket after the estimate is saved.
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Button className="w-full" variant="teal" onClick={onSaveEstimate}>
          Save estimate
        </Button>
        <Button
          className="w-full"
          disabled={!canGenerateTicket}
          onClick={onGenerateTicket}
        >
          Generate job ticket
        </Button>
        {ticketBlockedReason && (
          <p className="text-xs text-amber-700">{ticketBlockedReason}</p>
        )}
      </div>
    </div>
  );
}
