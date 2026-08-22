"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileUp, Sparkles } from "lucide-react";
import { PRODUCTS } from "@/lib/data/demo-data";
import { PRODUCT_OPTIONS, TYPE_OPTIONS } from "@/lib/data/example-catalog";
import { formatCurrency } from "@/lib/pricing/engine";
import type { Material, ParsedDocumentSpec, QuoteBreakdown, QuoteSpec } from "@/types";
import { QuoteCheckout } from "@/components/quote/quote-checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";

export const DEFAULT_SPEC: QuoteSpec = {
  product: "Roll Labels",
  type: "Prime / pressure-sensitive",
  material: "Matte BOPP",
  widthIn: 2.25,
  heightIn: 3.5,
  quantity: 10000,
  colors: 4,
  variableData: false,
};

function productFromSlug(slug: string | null): QuoteSpec {
  if (!slug) return DEFAULT_SPEC;
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return DEFAULT_SPEC;
  return { ...DEFAULT_SPEC, product: product.name };
}

const selectClass =
  "flex h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-teal";

export function SpecFields({
  spec,
  onChange,
  materials,
}: {
  spec: QuoteSpec;
  onChange: (spec: QuoteSpec) => void;
  materials: Material[];
}) {
  const substrates = materials.filter((m) => m.kind === "substrate");
  return (
    <div className="border border-slate-200 rounded-3xl p-6 bg-white space-y-4">
      <div className="font-semibold">Product attributes</div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Product</Label>
          <select
            className={`${selectClass} mt-1`}
            value={spec.product}
            onChange={(e) => onChange({ ...spec, product: e.target.value })}
          >
            {PRODUCT_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Type</Label>
          <select
            className={`${selectClass} mt-1`}
            value={spec.type}
            onChange={(e) => onChange({ ...spec, type: e.target.value })}
          >
            {TYPE_OPTIONS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Label>Material</Label>
          <select
            className={`${selectClass} mt-1`}
            value={spec.material}
            onChange={(e) => onChange({ ...spec, material: e.target.value })}
          >
            {(substrates.length
              ? substrates.map((m) => m.name)
              : [spec.material]
            ).map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Width (in)</Label>
          <Input
            type="number"
            step="0.01"
            className="mt-1"
            value={spec.widthIn}
            onChange={(e) => onChange({ ...spec, widthIn: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Height (in)</Label>
          <Input
            type="number"
            step="0.01"
            className="mt-1"
            value={spec.heightIn}
            onChange={(e) => onChange({ ...spec, heightIn: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>Quantity</Label>
          <Input
            type="number"
            className="mt-1"
            value={spec.quantity}
            onChange={(e) =>
              onChange({ ...spec, quantity: Number(e.target.value) })
            }
          />
        </div>
        <div>
          <Label>Colors</Label>
          <Input
            type="number"
            className="mt-1"
            value={spec.colors}
            onChange={(e) => onChange({ ...spec, colors: Number(e.target.value) })}
          />
        </div>
        <label className="sm:col-span-2 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(spec.variableData)}
            onChange={(e) =>
              onChange({ ...spec, variableData: e.target.checked })
            }
          />
          Variable data / serialization required
        </label>
      </div>
    </div>
  );
}

export function useLiveQuote(spec: QuoteSpec, companyId?: string) {
  const [breakdown, setBreakdown] = useState<QuoteBreakdown | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/quotes/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...spec, companyId }),
        });
        const data = await res.json();
        setBreakdown(data.breakdown as QuoteBreakdown);
      } catch {
        setBreakdown(null);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [spec, companyId]);

  return { breakdown, loading };
}

export function EstimatorWorkspace({
  enableCheckout = false,
  initialProductSlug = null,
  materials = [],
}: {
  enableCheckout?: boolean;
  initialProductSlug?: string | null;
  materials?: Material[];
}) {
  const { toast } = useToast();
  const [spec, setSpec] = useState<QuoteSpec>(() =>
    productFromSlug(initialProductSlug)
  );
  const [pasteText, setPasteText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [uploadName, setUploadName] = useState<string | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { breakdown, loading } = useLiveQuote(spec);

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
        product: data.product ?? data.productType ?? prev.product,
        type: data.type ?? prev.type,
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
      toast("Could not parse document.");
    } finally {
      setParsing(false);
    }
  }

  return (
    <>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="border border-slate-200 rounded-3xl p-6 bg-white">
            <div className="flex items-center gap-2 mb-4">
              <FileUp className="w-5 h-5 text-teal" />
              <div className="font-semibold">Document Intelligence (optional)</div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Upload specs or paste details to auto-fill the form — or enter
              product attributes below.
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

          <SpecFields spec={spec} onChange={setSpec} materials={materials} />
        </div>

        <div className="border border-slate-200 rounded-3xl p-6 bg-white h-fit lg:sticky lg:top-24">
          <div className="text-xs font-semibold text-slate-500 tracking-wider">
            INSTANT QUOTE
          </div>
          <div className="text-4xl font-semibold text-navy mt-2">
            {breakdown
              ? formatCurrency(breakdown.finalPrice)
              : loading
                ? "…"
                : "—"}
          </div>
          {breakdown && (
            <p className="text-sm text-slate-600 mt-2">
              {formatCurrency(breakdown.finalPrice / Math.max(spec.quantity, 1), true)}{" "}
              per unit · {spec.quantity.toLocaleString()} {spec.product.toLowerCase()}
            </p>
          )}
          <div className="mt-3 text-xs text-slate-500">
            Lead time 5–7 business days from approved proof
            {breakdown?.catalogSource === "example" ? " · EXAMPLE rates" : ""}
          </div>
          {enableCheckout ? (
            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                variant="cta"
                disabled={!breakdown}
                onClick={() => setCheckoutOpen(true)}
              >
                Place Order — Pay Now
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/portal/login">Save to account & track order</Link>
              </Button>
            </div>
          ) : (
            <Button asChild className="mt-6 w-full" variant="cta">
              <Link href="/portal/login">Request formal quote</Link>
            </Button>
          )}
        </div>
      </div>

      {checkoutOpen && breakdown && (
        <QuoteCheckout
          spec={spec}
          breakdown={breakdown}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  );
}
