"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/pricing/engine";
import type { QuoteBreakdown, QuoteSpec } from "@/types";
import { Button } from "@/components/ui/button";

export function CustomerQuotePanel({
  breakdown,
  spec,
  enableCheckout,
  onCheckout,
  onRequestQuote,
  quoteSaved,
}: {
  breakdown: QuoteBreakdown;
  spec: QuoteSpec;
  enableCheckout: boolean;
  onCheckout: () => void;
  onRequestQuote: () => void;
  quoteSaved: boolean;
}) {
  return (
    <div className="border border-slate-200 rounded-3xl p-6 bg-white h-fit lg:sticky lg:top-24">
      <div className="text-xs font-semibold text-slate-500 tracking-wider">
        INSTANT QUOTE
      </div>
      <div className="text-4xl font-semibold text-navy mt-2">
        {formatCurrency(breakdown.finalPrice)}
      </div>
      <p className="text-sm text-slate-600 mt-2">
        {formatCurrency(breakdown.finalPrice / Math.max(spec.quantity, 1), true)} per
        unit · {spec.quantity.toLocaleString()} {spec.productType.toLowerCase()}
      </p>
      <div className="mt-3 text-xs text-slate-500">
        Lead time 5–7 business days from approved proof
      </div>
      {quoteSaved && (
        <div className="mt-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
          Quote submitted. Your account team will confirm and send a formal PO.
        </div>
      )}
      {enableCheckout ? (
        <div className="mt-6 space-y-2">
          <Button className="w-full" variant="cta" onClick={onCheckout}>
            Place Order — Pay Now
          </Button>
          <Button variant="outline" className="w-full" onClick={onRequestQuote}>
            Request formal quote
          </Button>
          <Button asChild variant="ghost" className="w-full text-teal">
            <Link href="/portal/login">Save to account & track order</Link>
          </Button>
        </div>
      ) : (
        <Button className="mt-6 w-full" variant="cta" onClick={onRequestQuote}>
          Request formal quote
        </Button>
      )}
    </div>
  );
}
