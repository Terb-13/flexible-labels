"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { savePublicQuoteAction } from "@/app/quote/actions";
import { formatCurrency } from "@/lib/pricing/engine";
import type { QuoteBreakdown, QuoteSpec } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";

export function QuoteCheckout({
  spec,
  breakdown,
  companyId,
  loggedIn,
  onClose,
}: {
  spec: QuoteSpec;
  breakdown: QuoteBreakdown;
  companyId: string;
  loggedIn: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<"review" | "payment" | "done">("review");
  const [quoteNumber, setQuoteNumber] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function persist() {
    setBusy(true);
    try {
      const quote = await savePublicQuoteAction({ companyId, spec });
      setQuoteNumber(quote.quote_number ?? null);
      return quote;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save quote");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function completeOrder() {
    const quote = await persist();
    if (!quote) return;
    setStep("done");
    toast(`Quote ${quote.quote_number} saved to your account.`, true);
  }

  const portalHref = quoteNumber
    ? loggedIn
      ? `/portal?quote=${encodeURIComponent(quoteNumber)}`
      : `/portal/login?next=${encodeURIComponent(`/portal?quote=${quoteNumber}`)}`
    : "/portal/login";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl px-7 pt-6 pb-7 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-semibold text-xl">
              {step === "done" ? "Quote saved" : "Checkout"}
            </div>
            <div className="text-sm text-slate-600 mt-0.5">
              {spec.product} · {spec.material}
            </div>
          </div>
          <button type="button" className="text-slate-400 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {step === "review" && (
          <>
            <div className="border rounded-2xl p-4 text-sm space-y-2 bg-slate-50">
              <div className="font-semibold">{spec.product}</div>
              <div className="text-slate-600">
                {spec.widthIn}&quot; × {spec.heightIn}&quot; · {spec.quantity.toLocaleString()} qty ·{" "}
                {spec.colors} colors · {spec.material}
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Estimated total</span>
                <span>{formatCurrency(breakdown.finalPrice)}</span>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div>
                <Label>YOUR NAME</Label>
                <Input className="mt-1" placeholder="Your name" />
              </div>
              <div>
                <Label>EMAIL</Label>
                <Input type="email" className="mt-1" placeholder="you@company.com" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" variant="cta" onClick={() => setStep("payment")}>
                Continue
              </Button>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <div className="text-sm text-slate-600 mb-4">
              Estimated total:{" "}
              <span className="font-semibold text-lg text-navy">
                {formatCurrency(breakdown.finalPrice)}
              </span>
            </div>
            <p className="text-sm text-slate-600">
              We’ll save this as a quote on your account. Payment is confirmed after
              review — this does not invent a plant rate.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("review")}>
                Back
              </Button>
              <Button className="flex-1" variant="cta" disabled={busy} onClick={completeOrder}>
                {busy ? "Saving…" : "Save quote"}
              </Button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6" />
            </div>
            <div className="font-semibold text-lg">Quote {quoteNumber} is in your portal</div>
            <p className="text-sm text-slate-600 mt-2">
              Open the customer portal to track this quote. A proof follows after
              approval.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button asChild>
                <a href={portalHref}>Open customer portal</a>
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
