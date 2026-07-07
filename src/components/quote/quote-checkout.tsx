"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { formatCurrency } from "@/lib/pricing/engine";
import type { QuoteBreakdown, QuoteSpec } from "@/types";
import type { CustomerTier } from "@/components/portal/estimator-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";

export function QuoteCheckout({
  spec,
  breakdown,
  tier,
  onClose,
}: {
  spec: QuoteSpec;
  breakdown: QuoteBreakdown;
  tier: CustomerTier;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState<"review" | "payment" | "done">("review");
  const [orderNumber] = useState(
    () => `FLG-${47000 + Math.floor(Math.random() * 999)}`
  );

  function completeOrder() {
    setStep("done");
    toast(`Order ${orderNumber} confirmed. Proof will be ready within 24 hours.`, true);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl px-7 pt-6 pb-7 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="font-semibold text-xl">
              {step === "done" ? "Order confirmed" : "Checkout"}
            </div>
            <div className="text-sm text-slate-600 mt-0.5">
              {tier === "reseller" ? "Wholesale order" : "Business order"}
            </div>
          </div>
          <button type="button" className="text-slate-400 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        {step === "review" && (
          <>
            <div className="border rounded-2xl p-4 text-sm space-y-2 bg-slate-50">
              <div className="font-semibold">{spec.productType}</div>
              <div className="text-slate-600">
                {spec.widthIn}&quot; × {spec.heightIn}&quot; · {spec.quantity.toLocaleString()} qty ·{" "}
                {spec.colors} colors · {spec.material}
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(breakdown.finalPrice)}</span>
              </div>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              <div>
                <Label>YOUR NAME</Label>
                <Input className="mt-1" defaultValue="Taylor Kim" />
              </div>
              <div>
                <Label>COMPANY</Label>
                <Input className="mt-1" defaultValue="Acme Brands" />
              </div>
              <div className="sm:col-span-2">
                <Label>EMAIL</Label>
                <Input type="email" className="mt-1" defaultValue="taylor@acmebrands.co" />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" variant="cta" onClick={() => setStep("payment")}>
                Continue to payment
              </Button>
            </div>
          </>
        )}

        {step === "payment" && (
          <>
            <div className="text-sm text-slate-600 mb-4">
              Amount due:{" "}
              <span className="font-semibold text-lg text-navy">
                {formatCurrency(breakdown.finalPrice)}
              </span>
            </div>
            <div className="space-y-3 text-sm">
              <div>
                <Label>CARD NUMBER</Label>
                <Input className="mt-1 font-mono" defaultValue="4242 4242 4242 4242" readOnly />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>EXPIRY</Label>
                  <Input className="mt-1 font-mono" defaultValue="03 / 28" readOnly />
                </div>
                <div>
                  <Label>CVC</Label>
                  <Input className="mt-1 font-mono" defaultValue="242" readOnly />
                </div>
              </div>
            </div>
            {tier === "reseller" && (
              <p className="text-xs text-amber-700 mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                Reseller accounts may use Net 30 after approval. Demo checkout uses card payment.
              </p>
            )}
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("review")}>
                Back
              </Button>
              <Button className="flex-1" variant="cta" onClick={completeOrder}>
                Pay {formatCurrency(breakdown.finalPrice)}
              </Button>
            </div>
          </>
        )}

        {step === "done" && (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
              <Check className="w-6 h-6" />
            </div>
            <div className="font-semibold text-lg">You&apos;re all set</div>
            <div className="text-sm text-slate-600 mt-1">
              Order <span className="font-mono font-semibold">{orderNumber}</span> is in production
              queue.
            </div>
            <p className="text-xs text-slate-500 mt-4">
              A proof will be uploaded to your portal within 24 hours. Track status anytime.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Button asChild>
                <a href="/portal/login">Open Customer Portal</a>
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
