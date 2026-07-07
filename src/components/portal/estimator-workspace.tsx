"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FileUp, Sparkles } from "lucide-react";
import { DEMO_COMPANY, DEMO_RESELLER, PRODUCTS } from "@/lib/data/demo-data";
import { calculateQuote, formatCurrency } from "@/lib/pricing/engine";
import type { ParsedDocumentSpec, QuoteBreakdown, QuoteSpec } from "@/types";
import { QuoteCheckout } from "@/components/quote/quote-checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";

const DEFAULT_SPEC: QuoteSpec = {
  productType: "Roll Labels",
  widthIn: 2.25,
  heightIn: 3.5,
  quantity: 10000,
  colors: 4,
  material: "Matte BOPP",
  variableData: false,
};

export type CustomerTier = "business" | "reseller";

function productFromSlug(slug: string | null): QuoteSpec {
  if (!slug) return DEFAULT_SPEC;
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return DEFAULT_SPEC;
  return { ...DEFAULT_SPEC, productType: product.name };
}

export function EstimatorWorkspace({
  showBreakdown = false,
  enableCheckout = false,
  initialProductSlug = null,
  defaultTier = "business",
}: {
  showBreakdown?: boolean;
  enableCheckout?: boolean;
  initialProductSlug?: string | null;
  defaultTier?: CustomerTier;
}) {
  const { toast } = useToast();
  const [tier, setTier] = useState<CustomerTier>(defaultTier);
  const [spec, setSpec] = useState<QuoteSpec>(() =>
    productFromSlug(initialProductSlug)
  );
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const company = tier === "reseller" ? DEMO_RESELLER : DEMO_COMPANY;

  const breakdown = useMemo(
    () => calculateQuote(spec, company),
    [spec, company]
  );

  async function parseDocument(file?: File) {
    setParsing(true);
    try {
      const form = new FormData();
      if (file) form.append("file", file);
      if (pasteText.trim()) form.append("text", pasteText.trim());

      const res = await fetch("/api/documents/parse", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as ParsedDocumentSpec;
      setMissingFields(data.missingFields ?? []);

      setSpec((prev) => ({
        ...prev,
        productType: data.productType ?? prev.productType,
        widthIn: data.widthIn ?? prev.widthIn,
        heightIn: data.heightIn ?? prev.heightIn,
        quantity: data.quantity ?? prev.quantity,
        colors: data.colors ?? prev.colors,
        material: data.material ?? prev.material,
        variableData: data.variableData ?? prev.variableData,
      }));

      if (file) setUploadName(file.name);
      toast(
        data.missingFields?.length
          ? `Parsed with ${data.missingFields.length} field(s) needing review.`
          : "Document parsed — specs auto-filled.",
        !data.missingFields?.length
      );
    } catch {
      toast("Could not parse document. Using demo extraction.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {!showBreakdown && (
            <div className="border border-slate-200 rounded-3xl p-6 bg-white">
              <div className="font-semibold mb-1">Who is this quote for?</div>
              <p className="text-sm text-slate-600 mb-4">
                Business customers and resellers/wholesale partners see different
                pricing. Reseller accounts use lower margins and volume tiers.
              </p>
              <div className="inline-flex rounded-2xl border p-0.5 bg-slate-50 text-sm w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setTier("business")}
                  className={cn(
                    "flex-1 sm:flex-none px-5 py-2 rounded-[14px] text-sm font-semibold transition-colors",
                    tier === "business"
                      ? "view-toggle-active"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Business / DTC
                </button>
                <button
                  type="button"
                  onClick={() => setTier("reseller")}
                  className={cn(
                    "flex-1 sm:flex-none px-5 py-2 rounded-[14px] text-sm font-semibold transition-colors",
                    tier === "reseller"
                      ? "view-toggle-active"
                      : "text-slate-600 hover:text-slate-900"
                  )}
                >
                  Reseller / Wholesale
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                {tier === "reseller"
                  ? "Wholesale pricing for print partners and distributors. Net 30 available after account approval."
                  : "Standard pricing for brands, CPG, and direct buyers. Instant checkout available."}
              </p>
            </div>
          )}

          <div className="border border-slate-200 rounded-3xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <FileUp className="w-5 h-5 text-teal" />
              <div className="font-semibold">Document Intelligence (optional)</div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Upload specs or paste details to auto-fill the form — or enter specs
              manually below for an immediate quote.
            </p>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-8 cursor-pointer hover:border-teal transition-colors">
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.txt,.csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) parseDocument(f);
                }}
              />
              <Sparkles className="w-8 h-8 text-teal mb-2" />
              <span className="text-sm font-semibold text-center">
                Drop file or click to upload
              </span>
              {uploadName && (
                <span className="text-xs text-slate-500 mt-2">{uploadName}</span>
              )}
            </label>
            <div className="mt-4">
              <Label>Paste project details</Label>
              <Textarea
                className="mt-1"
                rows={3}
                placeholder='e.g. "18,000 matte BOPP roll labels 2.25 x 3.5 for refrigerated beverage, 4 colors"'
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <Button
                className="mt-2"
                variant="outline"
                disabled={parsing || !pasteText.trim()}
                onClick={() => parseDocument()}
              >
                {parsing ? "Parsing…" : "Parse pasted text"}
              </Button>
            </div>
            {missingFields.length > 0 && (
              <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                <div className="font-semibold mb-1">Missing or uncertain fields</div>
                <ul className="list-disc pl-5 space-y-1">
                  {missingFields.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border border-slate-200 rounded-3xl p-6 bg-white space-y-4">
            <div className="font-semibold">Job specifications</div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label>Product type</Label>
                <Input
                  className="mt-1"
                  value={spec.productType}
                  onChange={(e) => setSpec({ ...spec, productType: e.target.value })}
                />
              </div>
              <div>
                <Label>Width (in)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="mt-1"
                  value={spec.widthIn}
                  onChange={(e) =>
                    setSpec({ ...spec, widthIn: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Height (in)</Label>
                <Input
                  type="number"
                  step="0.01"
                  className="mt-1"
                  value={spec.heightIn}
                  onChange={(e) =>
                    setSpec({ ...spec, heightIn: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={spec.quantity}
                  onChange={(e) =>
                    setSpec({ ...spec, quantity: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label>Colors</Label>
                <Input
                  type="number"
                  className="mt-1"
                  value={spec.colors}
                  onChange={(e) =>
                    setSpec({ ...spec, colors: Number(e.target.value) })
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Material</Label>
                <Input
                  className="mt-1"
                  value={spec.material}
                  onChange={(e) => setSpec({ ...spec, material: e.target.value })}
                />
              </div>
              <label className="sm:col-span-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={spec.variableData}
                  onChange={(e) =>
                    setSpec({ ...spec, variableData: e.target.checked })
                  }
                />
                Variable data / serialization required
              </label>
            </div>
          </div>
        </div>

        <QuoteSummaryPanel
          breakdown={breakdown}
          spec={spec}
          showBreakdown={showBreakdown}
          tier={tier}
          enableCheckout={enableCheckout}
          onCheckout={() => setCheckoutOpen(true)}
        />
      </div>

      {checkoutOpen && (
        <QuoteCheckout
          spec={spec}
          breakdown={breakdown}
          tier={tier}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  );
}

function QuoteSummaryPanel({
  breakdown,
  spec,
  showBreakdown,
  tier,
  enableCheckout,
  onCheckout,
}: {
  breakdown: QuoteBreakdown;
  spec: QuoteSpec;
  showBreakdown: boolean;
  tier: CustomerTier;
  enableCheckout: boolean;
  onCheckout: () => void;
}) {
  return (
    <div className="border border-slate-200 rounded-3xl p-6 bg-white h-fit lg:sticky lg:top-24">
      <div className="text-xs font-semibold text-slate-500 tracking-wider">
        {showBreakdown ? "FULL ESTIMATE" : "INSTANT QUOTE"}
      </div>
      {!showBreakdown ? (
        <>
          <div className="text-4xl font-semibold text-navy mt-2">
            {formatCurrency(breakdown.finalPrice)}
          </div>
          <p className="text-sm text-slate-600 mt-2">
            {formatCurrency(breakdown.finalPrice / spec.quantity, true)} per unit ·{" "}
            {spec.quantity.toLocaleString()} {spec.productType.toLowerCase()}
          </p>
          <div className="mt-3 text-xs text-slate-500">
            {tier === "reseller" ? "Wholesale / reseller tier" : "Business pricing"} ·
            Lead time 5–7 business days from approved proof
          </div>
          {enableCheckout ? (
            <div className="mt-6 space-y-2">
              <Button className="w-full" variant="cta" onClick={onCheckout}>
                Place Order — Pay Now
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/portal/login">Save to account & track order</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full text-teal">
                <Link
                  href={`/ai-tools?prompt=${encodeURIComponent(
                    `Quote for ${spec.quantity} ${spec.productType} ${spec.widthIn}x${spec.heightIn} ${spec.material}`
                  )}`}
                >
                  Or discuss with AI assistant →
                </Link>
              </Button>
            </div>
          ) : (
            <Button className="mt-6 w-full" variant="cta">
              Request formal quote
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="text-3xl font-semibold text-navy mt-2">
            {formatCurrency(breakdown.finalPrice)}
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <Row label="Material" value={breakdown.materialCost} />
            <Row label="Press" value={breakdown.pressCost} />
            <Row label="Finishing" value={breakdown.finishingCost} />
            <Row label="Setup / VDP" value={breakdown.setupCost} />
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total cost</span>
              <span>{formatCurrency(breakdown.totalCost)}</span>
            </div>
            <div className="flex justify-between text-teal">
              <span>Margin ({breakdown.marginPercent}%)</span>
              <span>{formatCurrency(breakdown.marginAmount)}</span>
            </div>
          </div>
          {breakdown.needsApproval && (
            <div className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              Below target margin ({breakdown.targetMarginPercent}%). Sent to
              discount approval queue.
            </div>
          )}
          <Button className="mt-4 w-full" disabled={breakdown.needsApproval}>
            Generate job ticket
          </Button>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </div>
  );
}
